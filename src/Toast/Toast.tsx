"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { FrostedGlass } from "../FrostedGlass";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";
import { TOP_LAYER_ATTR } from "../utils/topLayer";
import styles from "./Toast.module.css";

/**
 * Where the toasts appear.
 * Где появляются уведомления.
 */
export type ToastPosition = "top-center" | "top-right" | "bottom-right";

/**
 * Look of the toast. "default" has no icon.
 * Вид уведомления. У "default" нет значка.
 */
export type ToastVariant = "default" | "info" | "success" | "warning" | "error";

export interface ToastAction {
  /** Button label. / Подпись кнопки. */
  label: ReactNode;
  /** Click handler. The toast closes after it. / Обработчик клика. После него тост закрывается. */
  onClick: () => void;
}

export interface ToastOptions {
  /**
   * Custom id. Showing a toast with an existing id replaces that toast.
   * Свой id. Показ тоста с уже существующим id заменяет этот тост.
   */
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  /** Default: "default". / По умолчанию "default". */
  variant?: ToastVariant;
  /**
   * Time on screen in ms. 0 keeps the toast until it is closed. Default comes from the provider.
   * Время показа в мс. 0 оставляет тост, пока его не закроют. По умолчанию берётся из провайдера.
   */
  duration?: number;
  /**
   * Position of this toast. Default comes from the provider.
   * Позиция этого тоста. По умолчанию берётся из провайдера.
   */
  position?: ToastPosition;
  /** Show the close button. Default: true. / Показывать кнопку закрытия. По умолчанию true. */
  dismissible?: boolean;
  /**
   * Action button. A toast with an action does not close by itself unless `duration` is set explicitly,
   * because a keyboard user could not reach the button in time.
   * Кнопка действия. Тост с действием не закрывается сам, пока `duration` не задан явно: пользователь
   * клавиатуры иначе не успел бы добраться до кнопки.
   */
  action?: ToastAction;
  /** Called when the toast starts closing. / Вызывается, когда тост начинает закрываться. */
  onClose?: () => void;
}

type ToastShortcutOptions = Omit<ToastOptions, "title" | "variant">;

export interface ToastApi {
  /** Shows a toast, returns its id. / Показывает тост, возвращает его id. */
  show: (input: string | ToastOptions) => string;
  info: (title: ReactNode, options?: ToastShortcutOptions) => string;
  success: (title: ReactNode, options?: ToastShortcutOptions) => string;
  warning: (title: ReactNode, options?: ToastShortcutOptions) => string;
  error: (title: ReactNode, options?: ToastShortcutOptions) => string;
  /**
   * Closes one toast by id, or all of them without an argument.
   * Закрывает один тост по id, а без аргумента все.
   */
  dismiss: (id?: string) => void;
  /** Current default position. / Текущая позиция по умолчанию. */
  position: ToastPosition;
  /**
   * Moves every toast without its own `position` to a new place.
   * Переносит все тосты без собственного `position` на новое место.
   */
  setPosition: (position: ToastPosition) => void;
}

/**
 * Texts read by screen readers. Defaults are Russian.
 * Тексты для скринридеров. По умолчанию русские.
 */
export interface ToastLabels {
  /** Name of the notification region. / Имя области уведомлений. */
  region?: string;
  /** Name of the close button. / Имя кнопки закрытия. */
  close?: string;
  info?: string;
  success?: string;
  warning?: string;
  error?: string;
}

const DEFAULT_LABELS: Required<ToastLabels> = {
  region: "Уведомления",
  close: "Закрыть",
  info: "Информация",
  success: "Успешно",
  warning: "Предупреждение",
  error: "Ошибка",
};

export interface ToastProviderProps {
  children?: ReactNode;
  /** Default position. Default: "top-right". / Позиция по умолчанию. По умолчанию "top-right". */
  position?: ToastPosition;
  /** Default time on screen in ms. Default: 5000. / Время показа по умолчанию в мс. По умолчанию 5000. */
  duration?: number;
  /**
   * Maximum number of visible toasts per position. The oldest ones close. Default: 5.
   * Максимум видимых тостов на позицию. Самые старые закрываются. По умолчанию 5.
   */
  limit?: number;
  /** Texts for screen readers. / Тексты для скринридеров. */
  labels?: ToastLabels;
}

interface ToastRecord extends ToastOptions {
  id: string;
  /** Grows when a toast is replaced by id, so it remounts and its timer restarts. / Растёт при замене по id: тост монтируется заново, таймер стартует сначала. */
  revision: number;
  leaving: boolean;
}

/**
 * Length of the exit animation. Keep in sync with --toast-duration in Toast.module.css (200ms).
 * Длительность анимации выхода. Держите равной --toast-duration в Toast.module.css (200ms).
 */
const EXIT_DURATION = 200;

/**
 * The tint is drawn by the glass itself, so it goes through `style` (the value comes from the CSS module).
 * Цвет стекла рисует само стекло, поэтому он идёт через `style` (значение задаёт CSS-модуль).
 */
const TOAST_STYLE: CSSProperties = { backgroundColor: "var(--toast-tint)" };
const POSITIONS: readonly ToastPosition[] = [
  "top-center",
  "top-right",
  "bottom-right",
];

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Ids of the toasts that exceed the limit: the oldest ones of every position.
 * Идентификаторы тостов сверх лимита: самые старые на каждой позиции.
 */
function overLimit(
  list: readonly ToastRecord[],
  defaultPosition: ToastPosition,
  limit: number,
): Set<string> {
  const max = Math.max(1, limit);
  const groups = new Map<ToastPosition, ToastRecord[]>();
  for (const t of list) {
    if (t.leaving) continue;
    const p = t.position ?? defaultPosition;
    groups.set(p, [...(groups.get(p) ?? []), t]);
  }
  const result = new Set<string>();
  groups.forEach((items) => {
    items.slice(0, Math.max(0, items.length - max)).forEach((t) => {
      result.add(t.id);
    });
  });
  return result;
}

/**
 * Global access to toasts. Must be used inside <ToastProvider>.
 * Глобальный доступ к уведомлениям. Работает только внутри <ToastProvider>.
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({
  children,
  position: positionProp = "top-right",
  duration = 5000,
  limit = 5,
  labels,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  // Источник правды — ref, state нужен только для перерисовки.
  const toastsRef = useRef<ToastRecord[]>([]);
  const removalTimers = useRef(new Map<string, number>());
  const counter = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<ToastPosition>(positionProp);
  const [lastPositionProp, setLastPositionProp] = useState(positionProp);
  // A new `position` prop resets the position right away (no frame with the old one).
  // Новый проп `position` сбрасывает позицию сразу (без кадра со старой).
  if (lastPositionProp !== positionProp) {
    setLastPositionProp(positionProp);
    setPosition(positionProp);
  }

  const positionRef = useRef(position);
  const limitRef = useRef(limit);
  useIsomorphicLayoutEffect(() => {
    positionRef.current = position;
    limitRef.current = limit;
  });

  const mergedLabels = useMemo<Required<ToastLabels>>(
    () => ({ ...DEFAULT_LABELS, ...labels }),
    [labels],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timers = removalTimers.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, []);

  const commit = useCallback((next: ToastRecord[]) => {
    toastsRef.current = next;
    setToasts(next);
  }, []);

  /*
   * Marks toasts as leaving, calls their onClose and schedules the removal. Returns the new list.
   * Помечает тосты как закрывающиеся, вызывает их onClose и планирует удаление. Возвращает новый список.
   */
  const startLeaving = useCallback(
    (current: ToastRecord[], ids: Set<string>): ToastRecord[] => {
      for (const t of current) {
        if (t.leaving || !ids.has(t.id)) continue;
        t.onClose?.();
        const timer = window.setTimeout(() => {
          removalTimers.current.delete(t.id);
          commit(toastsRef.current.filter((x) => x.id !== t.id));
        }, EXIT_DURATION);
        removalTimers.current.set(t.id, timer);
      }
      return current.map((t) =>
        !t.leaving && ids.has(t.id) ? { ...t, leaving: true } : t,
      );
    },
    [commit],
  );

  const dismiss = useCallback(
    (id?: string) => {
      const ids = new Set(
        toastsRef.current
          .filter((t) => !t.leaving && (id === undefined || t.id === id))
          .map((t) => t.id),
      );
      if (ids.size === 0) return;
      commit(startLeaving(toastsRef.current, ids));
    },
    [commit, startLeaving],
  );

  const show = useCallback(
    (input: string | ToastOptions) => {
      const options: ToastOptions =
        typeof input === "string" ? { title: input } : input;
      const id = options.id ?? `toast-${++counter.current}`;

      // Если тост с этим id уже закрывается, отменяем удаление.
      const pending = removalTimers.current.get(id);
      if (pending !== undefined) {
        window.clearTimeout(pending);
        removalTimers.current.delete(id);
      }

      const existing = toastsRef.current.find((t) => t.id === id);
      const next: ToastRecord[] = existing
        ? toastsRef.current.map((t) =>
            t.id === id
              ? {
                  ...options,
                  id,
                  revision: existing.revision + 1,
                  leaving: false,
                }
              : t,
          )
        : [...toastsRef.current, { ...options, id, revision: 0, leaving: false }];

      // The limit is applied in the same commit, so an extra toast is never drawn.
      // Лимит применяется в том же коммите, поэтому лишний тост не рисуется.
      const over = overLimit(next, positionRef.current, limitRef.current);
      commit(over.size > 0 ? startLeaving(next, over) : next);
      return id;
    },
    [commit, startLeaving],
  );

  const withVariant = useCallback(
    (variant: ToastVariant) =>
      (title: ReactNode, options?: ToastShortcutOptions) =>
        show({ ...options, title, variant }),
    [show],
  );

  // The limit or the position changed: close the extra toasts.
  // Изменились лимит или позиция: закрываем лишние тосты.
  useEffect(() => {
    const over = overLimit(toastsRef.current, position, limit);
    if (over.size > 0) commit(startLeaving(toastsRef.current, over));
  }, [position, limit, commit, startLeaving]);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      info: withVariant("info"),
      success: withVariant("success"),
      warning: withVariant("warning"),
      error: withVariant("error"),
      dismiss,
      position,
      setPosition,
    }),
    [show, withVariant, dismiss, position],
  );

  const groups = useMemo(() => {
    const result: Record<ToastPosition, ToastRecord[]> = {
      "top-center": [],
      "top-right": [],
      "bottom-right": [],
    };
    for (const t of toasts) result[t.position ?? position].push(t);
    return result;
  }, [toasts, position]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <>
            {POSITIONS.map((p) => (
              <ToastViewport
                key={p}
                placement={p}
                toasts={groups[p]}
                defaultDuration={duration}
                labels={mergedLabels}
                onDismiss={dismiss}
              />
            ))}
          </>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

interface ToastViewportProps {
  placement: ToastPosition;
  toasts: ToastRecord[];
  defaultDuration: number;
  labels: Required<ToastLabels>;
  onDismiss: (id: string) => void;
}

/*
 * The viewport is always mounted: screen readers announce additions only to a live region that already exists.
 * Вьюпорт смонтирован всегда: скринридеры озвучивают добавления только в уже существующую live-область.
 */
function ToastViewport({
  placement,
  toasts,
  defaultDuration,
  labels,
  onDismiss,
}: ToastViewportProps) {
  // Новые тосты ближе к краю экрана: сверху — выше, снизу — ниже.
  const items = placement.startsWith("top") ? [...toasts].reverse() : toasts;
  const hasToasts = items.length > 0;
  return (
    <div
      className={`${styles.viewport} ${styles[placement]}`}
      {...{ [TOP_LAYER_ATTR]: "" }}
      role={hasToasts ? "region" : undefined}
      aria-label={hasToasts ? labels.region : undefined}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {items.map((t) => (
        <ToastItem
          key={`${t.id}:${t.revision}`}
          toast={t}
          defaultDuration={defaultDuration}
          labels={labels}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastRecord;
  defaultDuration: number;
  labels: Required<ToastLabels>;
  onDismiss: (id: string) => void;
}

function ToastItem({
  toast,
  defaultDuration,
  labels,
  onDismiss,
}: ToastItemProps) {
  const {
    id,
    title,
    description,
    variant = "default",
    dismissible = true,
    action,
    leaving,
  } = toast;
  // A toast with an action stays until it is handled, unless the duration is set explicitly.
  // Тост с действием остаётся, пока его не обработают, если длительность не задана явно.
  const duration = toast.duration ?? (action ? 0 : defaultDuration);

  // Таймер с паузой: при наведении и фокусе оставшееся время запоминается.
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const remaining = useRef(duration);

  // Hover and focus are tracked separately: the timer runs only when neither holds the toast.
  // Наведение и фокус учитываются отдельно: таймер идёт, только когда тост не удерживает ни то, ни другое.
  const hovered = useRef(false);
  const focused = useRef(false);

  const stop = useCallback(() => {
    if (timer.current === null) return;
    window.clearTimeout(timer.current);
    timer.current = null;
    remaining.current -= Date.now() - startedAt.current;
  }, []);

  const start = useCallback(() => {
    if (leaving || duration <= 0 || timer.current !== null) return;
    startedAt.current = Date.now();
    timer.current = window.setTimeout(
      () => {
        timer.current = null;
        onDismiss(id);
      },
      Math.max(0, remaining.current),
    );
  }, [leaving, duration, id, onDismiss]);

  useEffect(() => {
    if (leaving) return undefined;
    start();
    return stop;
  }, [leaving, start, stop]);

  return (
    <FrostedGlass
      className={leaving ? `${styles.toast} ${styles.leaving}` : styles.toast}
      role={variant === "error" ? "alert" : undefined}
      width="min(380px, calc(100vw - 32px))"
      height="auto"
      style={TOAST_STYLE}
      onMouseEnter={() => {
        hovered.current = true;
        stop();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        if (!focused.current) start();
      }}
      onFocus={() => {
        focused.current = true;
        stop();
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        focused.current = false;
        if (!hovered.current) start();
      }}
    >
      <div className={styles.body}>
        {variant !== "default" && (
          <span
            className={`${styles.icon} ${styles[variant]}`}
            aria-hidden="true"
          >
            <VariantIcon variant={variant} />
          </span>
        )}

        <div className={styles.content}>
          {variant !== "default" && (
            <span className={styles.srOnly}>{labels[variant]}: </span>
          )}
          {title != null && <div className={styles.title}>{title}</div>}
          {description != null && (
            <div className={styles.description}>{description}</div>
          )}
          {action && (
            <button
              type="button"
              className={styles.action}
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
            >
              {action.label}
            </button>
          )}
        </div>

        {dismissible && (
          <button
            type="button"
            className={styles.close}
            aria-label={labels.close}
            onClick={() => onDismiss(id)}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </FrostedGlass>
  );
}

function VariantIcon({
  variant,
}: {
  variant: Exclude<ToastVariant, "default">;
}) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (variant) {
    case "success":
      return (
        <svg {...common}>
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      );
    case "error":
      return (
        <svg {...common}>
          <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M8 3.5v5.5" />
          <circle cx="8" cy="12" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case "info":
      return (
        <svg {...common}>
          <path d="M8 7.25v5" />
          <circle cx="8" cy="4.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
  }
}

function CloseIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}
