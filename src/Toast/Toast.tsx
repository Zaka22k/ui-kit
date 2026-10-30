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
import { LiquidGlass } from "../LiquidGlass";
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
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  // Источник правды — ref, state нужен только для перерисовки.
  const toastsRef = useRef<ToastRecord[]>([]);
  const removalTimers = useRef(new Map<string, number>());
  const counter = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<ToastPosition>(positionProp);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPosition(positionProp);
  }, [positionProp]);

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

  const dismiss = useCallback(
    (id?: string) => {
      const fresh = toastsRef.current.filter(
        (t) => !t.leaving && (id === undefined || t.id === id),
      );
      if (fresh.length === 0) return;
      const ids = new Set(fresh.map((t) => t.id));
      commit(
        toastsRef.current.map((t) =>
          ids.has(t.id) ? { ...t, leaving: true } : t,
        ),
      );
      for (const t of fresh) {
        t.onClose?.();
        const timer = window.setTimeout(() => {
          removalTimers.current.delete(t.id);
          commit(toastsRef.current.filter((x) => x.id !== t.id));
        }, EXIT_DURATION);
        removalTimers.current.set(t.id, timer);
      }
    },
    [commit],
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
      if (existing) {
        commit(
          toastsRef.current.map((t) =>
            t.id === id
              ? {
                  ...options,
                  id,
                  revision: existing.revision + 1,
                  leaving: false,
                }
              : t,
          ),
        );
      } else {
        commit([
          ...toastsRef.current,
          { ...options, id, revision: 0, leaving: false },
        ]);
      }
      return id;
    },
    [commit],
  );

  const withVariant = useCallback(
    (variant: ToastVariant) =>
      (title: ReactNode, options?: ToastShortcutOptions) =>
        show({ ...options, title, variant }),
    [show],
  );

  // Лимит: на каждой позиции остаются только последние `limit` тостов.
  useEffect(() => {
    const max = Math.max(1, limit);
    const groups = new Map<ToastPosition, ToastRecord[]>();
    for (const t of toasts) {
      if (t.leaving) continue;
      const p = t.position ?? position;
      groups.set(p, [...(groups.get(p) ?? []), t]);
    }
    groups.forEach((list) => {
      list
        .slice(0, Math.max(0, list.length - max))
        .forEach((t) => dismiss(t.id));
    });
  }, [toasts, position, limit, dismiss]);

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
  onDismiss: (id: string) => void;
}

function ToastViewport({
  placement,
  toasts,
  defaultDuration,
  onDismiss,
}: ToastViewportProps) {
  if (toasts.length === 0) return null;
  // Новые тосты ближе к краю экрана: сверху — выше, снизу — ниже.
  const items = placement.startsWith("top") ? [...toasts].reverse() : toasts;
  return (
    <div
      className={`${styles.viewport} ${styles[placement]}`}
      role="region"
      aria-label="Уведомления"
    >
      {items.map((t) => (
        <ToastItem
          key={`${t.id}:${t.revision}`}
          toast={t}
          defaultDuration={defaultDuration}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastRecord;
  defaultDuration: number;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, defaultDuration, onDismiss }: ToastItemProps) {
  const {
    id,
    title,
    description,
    variant = "default",
    dismissible = false,
    action,
    leaving,
  } = toast;
  const duration = toast.duration ?? defaultDuration;

  // Таймер с паузой: при наведении и фокусе оставшееся время запоминается.
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const remaining = useRef(duration);

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
    <LiquidGlass
      className={leaving ? `${styles.toast} ${styles.leaving}` : styles.toast}
      role={variant === "error" ? "alert" : "status"}
      width="min(380px, calc(100vw - 32px))"
      height="auto"
      style={TOAST_STYLE}
      onMouseEnter={stop}
      onMouseLeave={start}
      onFocus={stop}
      onBlur={start}
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
          {title != null && (
            <div
              className={styles.title}
            >
              {title}
            </div>
          )}
          {description != null && (
            <div className={styles.description}>
              {description}
            </div>
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
            aria-label="Закрыть"
            onClick={() => onDismiss(id)}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </LiquidGlass>
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
