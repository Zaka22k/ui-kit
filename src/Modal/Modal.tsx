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
}

const DEFAULT_ERROR_MESSAGE =
  "Не удалось выполнить действие. Попробуйте ещё раз.";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

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
}: ModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<{ error: unknown } | null>(
    null,
  );
  const [shouldRender, setShouldRender] = useState(isOpen);

  const submittingRef = useRef(false);
  const formId = useId();
  const titleId = useId();

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

    try {
      setIsSubmitting(true);
      await targetAction();
      onClose();
    } catch (error) {
      console.error("Ошибка при выполнении действия в модальном окне:", error);
      setActionError({ error });
      onError?.(error);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [shouldRender]);

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

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (
      closeOnBackdropClick &&
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
    if (target instanceof HTMLFormElement && target.id === formId) {
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
      className={`${styles.overlay} ${
        isOpen ? styles.overlayOpen : styles.overlayClose
      }`}
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
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
        onSubmit={handleDialogSubmit}
      >
        {/* 1. Заголовок */}
        <header className={styles.header}>
          <div
            id={titleId}
            className={`${styles.title} SubtitleTextBlockStyle`}
          >
            {title}
          </div>
          <Button
            icon={<CloseIcon />}
            aria-label="Закрыть модальное окно"
            onClick={onClose}
            disabled={isSubmitting}
            height={40}
          />
        </header>

        {/* 2. Тело окна */}
        <div
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
