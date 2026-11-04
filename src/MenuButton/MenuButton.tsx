"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  Ref,
} from "react";
import { createPortal } from "react-dom";
import { FrostedGlass } from "../FrostedGlass";
import styles from "./MenuButton.module.css";

/**
 * One row of the menu. / Одна строка меню.
 */
export interface MenuItem {
  /** Row content. / Содержимое строки. */
  label: ReactNode;
  /** Optional icon before the label. / Необязательная иконка перед подписью. */
  icon?: ReactNode;
  /** Called when the row is chosen. The menu closes after it. / Вызывается при выборе. После него меню закрывается. */
  onSelect?: () => void;
  disabled?: boolean;
  /** Red label for dangerous actions (delete, sign out). / Красная подпись для опасных действий. */
  destructive?: boolean;
}

/** A thin line between groups of rows. / Тонкая линия между группами строк. */
export interface MenuSeparator {
  type: "separator";
}

export type MenuEntry = MenuItem | MenuSeparator;

export interface MenuButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children" | "className" | "style" | "onClick"
> {
  /** Rows of the menu. / Строки меню. */
  items: readonly MenuEntry[];
  /**
   * `glass` is a button with its own glass. `plain` has no glass of its own: use it inside
   * <ToolbarGroup>, where the glass of the group is already there.
   * `glass` — кнопка со своим стеклом. `plain` — без собственного стекла: для <ToolbarGroup>,
   * где стекло уже есть у группы.
   */
  appearance?: "glass" | "plain";
  /** Icon of the button. Default: three dots. / Иконка кнопки. По умолчанию три точки. */
  icon?: ReactNode;
  /** Side of the square `glass` button in px. Default: 36. / Сторона квадратной кнопки `glass`, px. По умолчанию 36. */
  size?: number;
  /**
   * Which edge of the button the menu stays attached to. `end` grows to the left (right edge fixed),
   * `start` grows to the right. It flips on its own when there is no room.
   * К какому краю кнопки привязано меню. `end` растёт влево (правый край на месте), `start` вправо.
   * Если места нет, меню разворачивается само.
   */
  align?: "end" | "start";
  /** Controlled state. / Управляемое состояние. */
  open?: boolean;
  /** Called when the menu wants to open or close. / Вызывается, когда меню хочет открыться или закрыться. */
  onOpenChange?: (open: boolean) => void;
  /** Accessible name of the menu. Default: the label of the button. / Имя меню для скринридеров. По умолчанию подпись кнопки. */
  menuLabel?: string;
  /** Class of the button root. / Класс корня кнопки. */
  className?: string;
  /** Style of the button root. / Стиль корня кнопки. */
  style?: CSSProperties;
  /** Class of the menu panel. / Класс панели меню. */
  menuClassName?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

const isSeparator = (e: MenuEntry): e is MenuSeparator =>
  "type" in e && e.type === "separator";

const clamp = (v: number, a: number, b: number): number =>
  Math.min(Math.max(v, a), b);

/** Gap kept between the menu and the edge of the window, px. / Отступ меню от края окна, px. */
const VIEWPORT_MARGIN = 8;
/**
 * Corner radius of the open menu in units of --ControlCornerRadius (8px gives 20px).
 * Радиус углов раскрытого меню в долях --ControlCornerRadius (при 8px получается 20px).
 */
const MENU_RADIUS_FACTOR = 2.5;

/** The glass draws its own tint, so it goes through `style`. / Цвет стекла рисует само стекло, поэтому он идёт через `style`. */
const TRIGGER_TINT: CSSProperties = {
  backgroundColor: "var(--menu-trigger-tint)",
};
/**
 * Tint and radius follow the progress of the morph (--menu-p is written on every frame).
 * Цвет и радиус следуют за ходом превращения (--menu-p пишется на каждом кадре).
 */
const MENU_GLASS_STYLE: CSSProperties = {
  backgroundColor:
    "color-mix(in srgb, var(--menu-tint-open) calc(var(--menu-p) * 100%), var(--menu-tint-closed))",
  borderRadius: "var(--menu-radius)",
};

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function MoreIcon() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  );
}

interface Rect {
  l: number;
  t: number;
  w: number;
  h: number;
  r: number;
}

/**
 * A button that unfolds a menu out of itself. On click its glass grows into the menu panel and the
 * rows fade in; on close it folds back. Because the panel is rendered in <body>, it is real glass over
 * the page even when the button sits inside another glass panel (a backdrop-filter does not see through
 * another backdrop-filter), for example inside <ToolbarGroup>.
 *
 * Кнопка, из которой раскрывается меню. При нажатии её стекло вырастает в панель меню, строки
 * проявляются; при закрытии всё складывается обратно. Панель рисуется в <body>, поэтому это настоящее
 * стекло над страницей, даже если кнопка стоит внутри другого стеклянного блока (backdrop-filter не видит
 * сквозь другой backdrop-filter), например внутри <ToolbarGroup>.
 *
 * Keyboard: Enter, Space and ArrowDown open; ArrowUp/Down, Home, End and a letter move; Enter or Space
 * choose; Escape closes and returns focus to the button.
 * Клавиатура: Enter, Space и ArrowDown открывают; ArrowUp/Down, Home, End и буква перемещают; Enter или
 * Space выбирают; Escape закрывает и возвращает фокус на кнопку.
 */
export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(
  function MenuButton(
    {
      items,
      appearance = "glass",
      icon,
      size = 36,
      align = "end",
      open: openProp,
      onOpenChange,
      menuLabel,
      className,
      style,
      menuClassName,
      disabled,
      "aria-label": ariaLabel = "Ещё",
      onKeyDown,
      ...rest
    },
    forwardedRef,
  ) {
    const menuId = useId();

    const [innerOpen, setInnerOpen] = useState(false);
    const controlled = openProp !== undefined;
    const open = controlled ? openProp : innerOpen;
    // `present` keeps the panel in the DOM while it folds back.
    // `present` держит панель в DOM, пока она складывается обратно.
    const [present, setPresent] = useState(false);
    const [client, setClient] = useState(false);
    const show = open || present;

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const setButtonRef = useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    /** The element whose rectangle the menu grows from. / Элемент, из прямоугольника которого растёт меню. */
    const anchorRef = useRef<HTMLElement | null>(null);
    const frameRef = useRef<HTMLDivElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const restoreFocus = useRef(false);
    const viaKeyboard = useRef(false);
    const onOpenChangeRef = useRef(onOpenChange);
    onOpenChangeRef.current = onOpenChange;

    const setOpen = useCallback(
      (next: boolean, restore = false) => {
        restoreFocus.current = restore;
        if (!controlled) setInnerOpen(next);
        onOpenChangeRef.current?.(next);
      },
      [controlled],
    );

    useEffect(() => setClient(true), []);

    // ---------- Morph: a damped spring from the button rectangle to the menu rectangle ----------
    // ---------- Превращение: затухающая пружина от прямоугольника кнопки к прямоугольнику меню ----------
    const geo = useRef<{ from: Rect; to: Rect } | null>(null);
    const spring = useRef<{
      x: number;
      v: number;
      t: number;
      raf: number;
      last: number;
      done?: () => void;
    }>({ x: 0, v: 0, t: 0, raf: 0, last: 0 });

    const apply = useCallback((p: number) => {
      const f = frameRef.current;
      const g = geo.current;
      if (!f || !g) return;
      const q = Math.max(0, p);
      const { from, to } = g;
      f.style.left = `${from.l + (to.l - from.l) * q}px`;
      f.style.top = `${from.t + (to.t - from.t) * q}px`;
      f.style.width = `${Math.max(1, from.w + (to.w - from.w) * q)}px`;
      f.style.height = `${Math.max(1, from.h + (to.h - from.h) * q)}px`;
      const c = clamp(p, 0, 1);
      f.style.setProperty("--menu-radius", `${from.r + (to.r - from.r) * c}px`);
      f.style.setProperty("--menu-p", String(c));
      f.style.setProperty(
        "--menu-content",
        String(clamp((p - 0.3) / 0.45, 0, 1)),
      );
      f.style.setProperty("--menu-icon", String(1 - clamp(p / 0.25, 0, 1)));
    }, []);

    const runSpring = useCallback(
      (target: number, done?: () => void) => {
        const s = spring.current;
        s.t = target;
        s.done = done;
        if (prefersReducedMotion()) {
          cancelAnimationFrame(s.raf);
          s.raf = 0;
          s.x = target;
          s.v = 0;
          apply(target);
          s.done?.();
          return;
        }
        if (s.raf) return; // a running loop picks up the new target / работающий цикл подхватит новую цель
        s.last = performance.now();
        const step = (now: number) => {
          const dt = Math.min(0.032, (now - s.last) / 1000);
          s.last = now;
          // opening has a little overshoot, closing has none
          // открытие с небольшим перелётом, закрытие без него
          const opening = s.t === 1;
          const k = opening ? 300 : 460;
          const c = 2 * (opening ? 0.74 : 1) * Math.sqrt(k);
          const n = Math.max(1, Math.ceil(dt / 0.004));
          const h = dt / n;
          for (let i = 0; i < n; i++) {
            s.v += (-k * (s.x - s.t) - c * s.v) * h;
            s.x += s.v * h;
          }
          if (Math.abs(s.x - s.t) < 0.0008 && Math.abs(s.v) < 0.01) {
            s.raf = 0;
            s.x = s.t;
            s.v = 0;
            apply(s.t);
            s.done?.();
            return;
          }
          apply(s.x);
          s.raf = requestAnimationFrame(step);
        };
        s.raf = requestAnimationFrame(step);
      },
      [apply],
    );

    useEffect(
      () => () => {
        cancelAnimationFrame(spring.current.raf);
        spring.current.raf = 0;
      },
      [],
    );

    // Open or close: measure, then run the spring.
    // Открытие и закрытие: замеряем и запускаем пружину.
    useIsomorphicLayoutEffect(() => {
      if (!client) return;
      const frame = frameRef.current;
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      const s = spring.current;

      if (open) {
        if (!frame || !anchor || !menu) return;
        setPresent(true);

        const a = anchor.getBoundingClientRect();
        const W = menu.offsetWidth;
        const H = menu.offsetHeight;
        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;
        const M = VIEWPORT_MARGIN;

        // horizontal: keep the chosen edge, flip when it does not fit
        // по горизонтали: держим выбранный край, при нехватке места разворачиваем
        let left = align === "end" ? a.right - W : a.left;
        if (left < M && align === "end") left = a.left;
        if (left + W > vw - M && align === "start") left = a.right - W;
        left = clamp(left, M, Math.max(M, vw - M - W));
        // vertical: grows down from the top of the button, or up from its bottom
        // по вертикали: растёт вниз от верха кнопки или вверх от её низа
        const up = a.top + H > vh - M && a.bottom - H >= M;
        const top = clamp(
          up ? a.bottom - H : a.top,
          M,
          Math.max(M, vh - M - H),
        );

        const from: Rect = {
          l: a.left,
          t: a.top,
          w: a.width,
          h: a.height,
          r: Math.min(a.width, a.height) / 2,
        };
        const radius =
          (parseFloat(
            getComputedStyle(anchor).getPropertyValue("--ControlCornerRadius"),
          ) || 8) * MENU_RADIUS_FACTOR;
        const to: Rect = { l: left, t: top, w: W, h: H, r: radius };
        geo.current = { from, to };

        const right = a.left + a.width / 2 > left + W / 2;
        frame.dataset.x = right ? "right" : "left";
        frame.dataset.y = up ? "bottom" : "top";
        frame.style.setProperty("--menu-anchor-w", `${a.width}px`);
        frame.style.setProperty("--menu-anchor-h", `${a.height}px`);
        // the panel lives in <body>: carry the theme of the button over
        // панель живёт в <body>: переносим тему кнопки
        const themed = anchor.closest<HTMLElement>("[data-theme]");
        if (themed?.dataset.theme) frame.dataset.theme = themed.dataset.theme;
        else delete frame.dataset.theme;

        apply(s.x);
        runSpring(1);
        (viaKeyboard.current
          ? menu.querySelector<HTMLElement>(
              '[role="menuitem"]:not([aria-disabled="true"])',
            )
          : menu
        )?.focus({ preventScroll: true });
        viaKeyboard.current = false;
      } else if (present) {
        runSpring(0, () => setPresent(false));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, client]);

    // Return focus to the button once it is visible again.
    // Возвращаем фокус на кнопку, когда она снова видна.
    useEffect(() => {
      if (show || !restoreFocus.current) return;
      restoreFocus.current = false;
      buttonRef.current?.focus({ preventScroll: true });
    }, [show]);

    // Close on an outside press, Escape, scroll and resize.
    // Закрываем по нажатию снаружи, Escape, прокрутке и изменению размера.
    useEffect(() => {
      if (!open) return;
      const inside = (t: EventTarget | null) =>
        t instanceof Node && !!frameRef.current?.contains(t);
      const onDown = (e: PointerEvent) => {
        if (!inside(e.target)) setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false, true);
        }
      };
      const onScroll = (e: Event) => {
        if (!inside(e.target)) setOpen(false);
      };
      const onResize = () => setOpen(false);
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("keydown", onKey, true);
      window.addEventListener("scroll", onScroll, true);
      window.addEventListener("resize", onResize);
      return () => {
        document.removeEventListener("pointerdown", onDown, true);
        document.removeEventListener("keydown", onKey, true);
        window.removeEventListener("scroll", onScroll, true);
        window.removeEventListener("resize", onResize);
      };
    }, [open, setOpen]);

    const handleMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
      const menu = menuRef.current;
      if (!menu) return;
      const rows = Array.from(
        menu.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([aria-disabled="true"])',
        ),
      );
      if (rows.length === 0) return;
      const i = rows.indexOf(document.activeElement as HTMLElement);
      const go = (n: number) => {
        e.preventDefault();
        rows[n]?.focus({ preventScroll: true });
      };
      switch (e.key) {
        case "ArrowDown":
          return go((i + 1) % rows.length);
        case "ArrowUp":
          return go(i <= 0 ? rows.length - 1 : i - 1);
        case "Home":
          return go(0);
        case "End":
          return go(rows.length - 1);
        case "Tab":
          e.preventDefault();
          return setOpen(false, true);
        default: {
          // typeahead by the first letter / быстрый переход по первой букве
          if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
          const ch = e.key.toLowerCase();
          const order = [...rows.slice(i + 1), ...rows.slice(0, i + 1)];
          const hit = order.find((r) =>
            (r.textContent ?? "").trim().toLowerCase().startsWith(ch),
          );
          if (hit) {
            e.preventDefault();
            hit.focus({ preventScroll: true });
          }
        }
      }
    };

    const handleTriggerClick = (e: { detail: number }) => {
      if (disabled) return;
      viaKeyboard.current = e.detail === 0;
      setOpen(!open, false);
    };
    const handleTriggerKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || disabled) return;
      if (e.key === "ArrowDown" && !open) {
        e.preventDefault();
        viaKeyboard.current = true;
        setOpen(true);
      }
    };

    const setPlainRef = useCallback(
      (node: HTMLButtonElement | null) => {
        anchorRef.current = node;
        setButtonRef(node);
      },
      [setButtonRef],
    );

    const triggerProps = {
      ...rest,
      ref: setButtonRef,
      type: "button" as const,
      disabled,
      "aria-label": ariaLabel,
      "aria-haspopup": "menu" as const,
      "aria-expanded": open,
      "aria-controls": show ? menuId : undefined,
      onClick: handleTriggerClick,
      onKeyDown: handleTriggerKeyDown,
    };
    const glyph = icon ?? <MoreIcon />;

    return (
      <>
        {appearance === "plain" ? (
          <button
            {...triggerProps}
            ref={setPlainRef}
            data-open={show ? "" : undefined}
            className={cx(styles.button, styles.plain, className)}
            style={style}
          >
            {glyph}
          </button>
        ) : (
          <FrostedGlass
            ref={anchorRef as Ref<HTMLDivElement>}
            interactive={!disabled}
            width={size}
            height={size}
            data-open={show ? "" : undefined}
            className={cx(styles.panel, className)}
            style={{ ...TRIGGER_TINT, ...style }}
          >
            <button {...triggerProps} className={styles.button}>
              {glyph}
            </button>
          </FrostedGlass>
        )}

        {client &&
          show &&
          createPortal(
            <div
              ref={frameRef}
              className={styles.frame}
              data-appearance={appearance}
            >
              <FrostedGlass
                className={cx(styles.glass, menuClassName)}
                width="100%"
                height="100%"
                style={MENU_GLASS_STYLE}
              />
              <span className={styles.icon} aria-hidden="true">
                {glyph}
              </span>
              <div
                ref={menuRef}
                id={menuId}
                role="menu"
                tabIndex={-1}
                aria-label={menuLabel ?? ariaLabel}
                className={styles.menu}
                onKeyDown={handleMenuKeyDown}
              >
                {items.map((entry, index) =>
                  isSeparator(entry) ? (
                    <div
                      key={`s${index}`}
                      role="separator"
                      className={styles.separator}
                    />
                  ) : (
                    <button
                      key={index}
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      aria-disabled={entry.disabled || undefined}
                      className={cx(
                        styles.item,
                        entry.destructive && styles.destructive,
                      )}
                      onClick={() => {
                        if (entry.disabled) return;
                        entry.onSelect?.();
                        setOpen(false, true);
                      }}
                    >
                      {entry.icon && (
                        <span className={styles.itemIcon} aria-hidden="true">
                          {entry.icon}
                        </span>
                      )}
                      {entry.label}
                    </button>
                  ),
                )}
              </div>
            </div>,
            document.body,
          )}
      </>
    );
  },
);

export default MenuButton;
