"use client";

import { useState, useEffect, useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import type {
  ReactNode,
  MouseEvent,
  FormEvent,
  AnimationEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Button, { type ButtonAppearance } from "../Button/Button";
import { TOP_LAYER_ATTR } from "../utils/topLayer";
import styles from "./Modal.module.css";

export interface ModalFormRenderProps {
  /** ID формы, который вешается на <form id={formId}> */
  formId: string;
  /** Флаг выполнения действия (чтобы блокировать поля ввода) */
  isSubmitting: boolean;
  /** Регистрация обработчика отправки изнутри компонента формы */
  registerAction: (fn: () => void | Promise<void>) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Может быть обычным JSX (для алерта) или функцией (для формы) */
  children: ReactNode | ((props: ModalFormRenderProps) => ReactNode);
  actionText?: string;
  actionAppearance?: ButtonAppearance;
  onAction?: () => void | Promise<void>;
  /** Вызывается, если действие завершилось ошибкой (например, показать тост) */
  onError?: (error: unknown) => void;
  /**
   * Сообщение об ошибке в футере окна при исключении в `onAction` / `registerAction`.
   * По умолчанию: «Не удалось выполнить действие. Попробуйте ещё раз.»
   */
  errorMessage?: ReactNode | ((error: unknown) => ReactNode);
  width?: number | string;
  closeOnBackdropClick?: boolean;
  /** Accessible name of the close button. По умолчанию: «Закрыть модальное окно». */
  closeLabel?: string;
}

const DEFAULT_ERROR_MESSAGE =
  "Не удалось выполнить действие. Попробуйте ещё раз.";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Fallback for the exit animation: if `animationend` never fires (hidden tab, animations switched off),
 * the closed dialog is still removed, so it does not keep the scroll lock and the focus trap.
 * Запасной выход для анимации закрытия: если `animationend` не пришёл (скрытая вкладка, отключённые
 * анимации), закрытое окно всё равно убирается и не держит блокировку прокрутки и ловушку фокуса.
 */
const EXIT_FALLBACK_MS = 600;

const SKIPPED_BODY_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "NOSCRIPT"]);

/*
 * Scroll lock shared by every open dialog. The scrollbar width is compensated, so the page does not jump.
 * Блокировка прокрутки, общая для всех открытых окон. Ширина полосы прокрутки компенсируется, страница не прыгает.
 */
let scrollLocks = 0;
let savedBodyStyle: { overflow: string; paddingRight: string } | null = null;

function lockBodyScroll(): () => void {
  const body = document.body;
  if (scrollLocks++ === 0) {
    savedBodyStyle = {
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    };
    const scrollbar =
      window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) {
      body.style.paddingRight = `calc(${getComputedStyle(body).paddingRight} + ${scrollbar}px)`;
    }
    body.style.overflow = "hidden";
  }
  return () => {
    if (--scrollLocks === 0 && savedBodyStyle) {
      body.style.overflow = savedBodyStyle.overflow;
      body.style.paddingRight = savedBodyStyle.paddingRight;
      savedBodyStyle = null;
    }
  };
}

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "file",
  "image",
  "radio",
  "reset",
  "submit",
]);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width={18}
    height={18}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
);
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  actionText,
  actionAppearance = "primary",
  onAction,
  onError,
  errorMessage = DEFAULT_ERROR_MESSAGE,
  width = 480,
  closeOnBackdropClick = true,
  closeLabel = "Закрыть модальное окно",
}: ModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<{ error: unknown } | null>(
    null,
  );
  const [shouldRender, setShouldRender] = useState(isOpen);

  const submittingRef = useRef(false);
  const formId = useId();
  const titleId = useId();
  const bodyId = useId();

  const overlayRef = useRef<HTMLDivElement | null>(null);
  const pressedOnBackdropRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const innerActionRef = useRef<(() => void | Promise<void>) | null>(null);

  const registerAction = useCallback((fn: () => void | Promise<void>) => {
    innerActionRef.current = fn;
  }, []);

  const hasAction = Boolean(
    actionText || onAction || typeof children === "function",
  );

  useEffect(() => {
    if (isOpen) {
      const dialog = dialogRef.current;
      if (
        typeof document !== "undefined" &&
        (!dialog || !dialog.contains(document.activeElement))
      ) {
        previouslyFocusedRef.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      }
      setShouldRender(true);
    } else {
      innerActionRef.current = null;
      setActionError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen || !shouldRender) return;
    const timer = setTimeout(() => setShouldRender(false), EXIT_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [isOpen, shouldRender]);

  const handleAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isOpen) {
      setShouldRender(false);
    }
  };

  const executeAction = async () => {
    if (submittingRef.current) return;

    const targetAction = innerActionRef.current ?? onAction;

    if (!targetAction) {
      onClose();
      return;
    }

    submittingRef.current = true;
    setActionError(null);

    let succeeded = false;
    try {
      setIsSubmitting(true);
      await targetAction();
      succeeded = true;
    } catch (error) {
      console.error("Ошибка при выполнении действия в модальном окне:", error);
      setActionError({ error });
      onError?.(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }

    // Outside the try block: an error thrown by onClose is not an error of the action.
    // Вне try: ошибка в onClose не считается ошибкой действия.
    if (succeeded) onClose();
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        if (event.defaultPrevented || isSubmitting) return;
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter(
          (el) =>
            !el.matches(":disabled") &&
            el.offsetParent !== null &&
            getComputedStyle(el).visibility !== "hidden",
        );

        if (focusable.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (!dialog.contains(active) || active === dialog) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [onClose, isSubmitting, isOpen],
  );

  useEffect(() => {
    if (!shouldRender) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shouldRender, handleKeyDown]);

  useEffect(() => {
    if (!shouldRender) return;
    return lockBodyScroll();
  }, [shouldRender]);

  // The rest of the page becomes inert while the dialog is open (not only for Tab, but for screen readers too).
  // Остальная страница становится inert, пока окно открыто (не только для Tab, но и для скринридеров).
  useEffect(() => {
    if (!shouldRender || !isOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const inerted: Element[] = [];
    for (const el of Array.from(document.body.children)) {
      if (
        el === overlay ||
        el.hasAttribute("inert") ||
        el.hasAttribute(TOP_LAYER_ATTR) ||
        SKIPPED_BODY_TAGS.has(el.tagName)
      ) {
        continue;
      }
      el.setAttribute("inert", "");
      inerted.push(el);
    }
    return () => inerted.forEach((el) => el.removeAttribute("inert"));
  }, [shouldRender, isOpen]);

  useEffect(() => {
    if (!shouldRender) return;

    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus({ preventScroll: true });
    }

    return () => {
      const previous = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (previous && previous !== document.body && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [shouldRender]);
  if (!shouldRender || typeof document === "undefined") return null;

  // A click closes the dialog only when it started and ended on the backdrop (not after selecting text).
  // Клик закрывает окно, только если начался и закончился на фоне (не после выделения текста).
  const handleBackdropMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    pressedOnBackdropRef.current = e.target === e.currentTarget;
  };

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    const startedOnBackdrop = pressedOnBackdropRef.current;
    pressedOnBackdropRef.current = false;
    if (
      closeOnBackdropClick &&
      startedOnBackdrop &&
      e.target === e.currentTarget &&
      !isSubmitting &&
      isOpen
    ) {
      onClose();
    }
  };

  const submitForm = () => {
    if (isSubmitting) return;
    const form = document.getElementById(formId);
    if (
      !(form instanceof HTMLFormElement) ||
      !dialogRef.current?.contains(form)
    ) {
      void executeAction();
      return;
    }
    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else if (form.noValidate || form.reportValidity()) {
      void executeAction();
    }
  };

  const handleDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing) {
      return;
    }
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (NON_TEXT_INPUT_TYPES.has(target.type)) return;
    if (!target.form || target.form.id !== formId) return;

    e.preventDefault();
    submitForm();
  };

  const handleDialogSubmit = (e: FormEvent<HTMLDivElement>) => {
    const target = e.target;
    if (!(target instanceof HTMLFormElement)) return;
    // A form with the formId, or any form nobody handled (no own handler, no `action`), runs the dialog action
    // instead of reloading the page.
    // Форма с formId или любая необработанная форма (нет своего обработчика и `action`) запускает действие окна
    // вместо перезагрузки страницы.
    const unhandled =
      !e.defaultPrevented &&
      !target.hasAttribute("action") &&
      target.method !== "dialog";
    if (target.id === formId || unhandled) {
      e.preventDefault();
      void executeAction();
    }
  };

  const errorContent = actionError
    ? typeof errorMessage === "function"
      ? errorMessage(actionError.error)
      : errorMessage
    : null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`${styles.overlay} ${
        isOpen ? styles.overlayOpen : styles.overlayClose
      }`}
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      onAnimationEnd={handleAnimationEnd}
    >
      <div
        className={`${styles.modal} ${
          isOpen ? styles.modalOpen : styles.modalClose
        }`}
        ref={dialogRef}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={typeof children === "function" ? undefined : bodyId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onSubmit={handleDialogSubmit}
      >
        {/* 1. Заголовок */}
        <header className={styles.header}>
          <h2
            id={titleId}
            className={`${styles.title} SubtitleTextBlockStyle`}
          >
            {title}
          </h2>
          <Button
            icon={<CloseIcon />}
            aria-label={closeLabel}
            onClick={() => onClose()}
            disabled={isSubmitting}
            height={40}
          />
        </header>

        {/* 2. Тело окна */}
        <div
          id={bodyId}
          className={`${styles.body} ${
            !hasAction ? styles.bodyNoFooter : ""
          } BodyTextBlockStyle`}
        >
          {typeof children === "function"
            ? children({
                formId,
                isSubmitting,
                registerAction,
              })
            : children}
        </div>

        {/* 3. Опциональный сектор кнопки действия */}
        {hasAction && (
          <footer className={styles.footer}>
            {errorContent !== null && errorContent !== undefined && (
              <div
                role="alert"
                className={`${styles.footerError} BodyTextBlockStyle`}
              >
                {errorContent}
              </div>
            )}
            <Button
              appearance={actionAppearance}
              onClick={submitForm}
              disabled={isSubmitting}
              height={36}
            >
              {actionText ?? "Подтвердить"}
            </Button>
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
