"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./ContextMenu.module.css";

/**
 * A menu command.
 * Пункт меню.
 */
export interface ContextMenuAction {
  /** Unique within the menu. / Уникален в пределах меню. */
  id: string;
  /** Text of the item. / Текст пункта. */
  label: ReactNode;
  /** Icon, 16×16. / Иконка 16×16. */
  icon?: ReactNode;
  /**
   * Hint such as a keyboard shortcut. Display only: it does not bind the keys.
   * Подсказка, например сочетание клавиш. Только показывается: клавиши не привязывает.
   */
  hint?: string;
  /** Red item for destructive commands. / Красный пункт для опасных команд. */
  danger?: boolean;
  /** Greyed out, cannot be chosen. / Затемнён, выбрать нельзя. */
  disabled?: boolean;
  /** Called after the menu has closed. / Вызывается после закрытия меню. */
  onSelect?: () => void;
}

/**
 * A thin line between groups of items.
 * Тонкая линия между группами пунктов.
 */
export interface ContextMenuSeparator {
  type: "separator";
  id?: string;
}

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparator;

export interface ContextMenuProps {
  /** Items of the menu. / Пункты меню. */
  items: readonly ContextMenuItem[];
  /**
   * Where the menu opens, in viewport coordinates (clientX / clientY).
   * Где открывается меню, в координатах окна (clientX / clientY).
   */
  x: number;
  y: number;
  /**
   * Called when the menu wants to close.
   * Вызывается, когда меню хочет закрыться.
   */
  onClose: (restoreFocus: boolean) => void;
  /**
   * Put the cursor on the first available item at once (use it when opened from the keyboard).
   * Сразу поставить курсор на первый доступный пункт (для открытия с клавиатуры).
   */
  activateFirst?: boolean;
  /** Accessible name of the menu. / Доступное имя меню. */
  "aria-label"?: string;
  /** Class of the panel. / Класс панели. */
  className?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

const isSeparator = (item: ContextMenuItem): item is ContextMenuSeparator =>
  "type" in item && item.type === "separator";

const EDGE = 8;

interface Placement {
  left: number;
  top: number;
  flipX: boolean;
  flipY: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), Math.max(min, max));

export function ContextMenu({
  items,
  x,
  y,
  onClose,
  activateFirst = false,
  className,
  "aria-label": ariaLabel,
}: ContextMenuProps) {
  const baseId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const enabled = useMemo(
    () =>
      items.flatMap((item, index) =>
        !isSeparator(item) && !item.disabled ? [index] : [],
      ),
    [items],
  );

  const [active, setActive] = useState<number>(() =>
    activateFirst && enabled.length > 0 ? enabled[0] : -1,
  );
  const [placement, setPlacement] = useState<Placement>({
    left: x,
    top: y,
    flipX: false,
    flipY: false,
  });

  const hasIcons = items.some((item) => !isSeparator(item) && item.icon);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useIsomorphicLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const flipX = x + w > vw - EDGE && x - w >= EDGE;
    const flipY = y + h > vh - EDGE && y - h >= EDGE;
    const next: Placement = {
      left: clamp(flipX ? x - w : x, EDGE, vw - w - EDGE),
      top: clamp(flipY ? y - h : y, EDGE, vh - h - EDGE),
      flipX,
      flipY,
    };
    setPlacement((prev) =>
      prev.left === next.left &&
      prev.top === next.top &&
      prev.flipX === next.flipX &&
      prev.flipY === next.flipY
        ? prev
        : next,
    );
  }, [x, y, items]);

  useEffect(() => {
    menuRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const close = () => onCloseRef.current(false);
    const inside = (target: EventTarget | null) =>
      target instanceof Node && !!panelRef.current?.contains(target);

    const onPointerDown = (e: PointerEvent) => {
      if (!inside(e.target)) close();
    };
    const onScroll = (e: Event) => {
      if (!inside(e.target)) close();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
    };
  }, []);

  useEffect(() => {
    if (active < 0) return;
    document
      .getElementById(`${baseId}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, baseId]);

  const choose = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || isSeparator(item) || item.disabled) return;
      onCloseRef.current(true);
      item.onSelect?.();
    },
    [items],
  );

  const move = (step: 1 | -1) => {
    if (enabled.length === 0) return;
    const at = enabled.indexOf(active);
    const next =
      at === -1
        ? step === 1
          ? 0
          : enabled.length - 1
        : (at + step + enabled.length) % enabled.length;
    setActive(enabled[next]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowDown":
        move(1);
        break;
      case "ArrowUp":
        move(-1);
        break;
      case "Home":
        if (enabled.length) setActive(enabled[0]);
        break;
      case "End":
        if (enabled.length) setActive(enabled[enabled.length - 1]);
        break;
      case "Enter":
      case " ":
        if (active >= 0) choose(active);
        break;
      case "Escape":
      case "Tab":
        onCloseRef.current(true);
        break;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
  };

  if (typeof document === "undefined") return null;

  const panelStyle: CSSProperties = {
    position: "fixed",
    left: placement.left,
    top: placement.top,
    transformOrigin: `${placement.flipX ? "right" : "left"} ${
      placement.flipY ? "bottom" : "top"
    }`,
  };

  return createPortal(
    <div
      ref={panelRef}
      className={cx(styles.menu, className)}
      style={panelStyle}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={menuRef}
        role="menu"
        aria-orientation="vertical"
        aria-label={ariaLabel}
        aria-activedescendant={active >= 0 ? `${baseId}-${active}` : undefined}
        tabIndex={-1}
        className={styles.list}
        onKeyDown={handleKeyDown}
      >
        {items.map((item, index) => {
          if (isSeparator(item)) {
            return (
              <div
                key={item.id ?? `separator-${index}`}
                role="separator"
                className={styles.separator}
              />
            );
          }
          return (
            <div
              key={item.id}
              id={`${baseId}-${index}`}
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              className={cx(
                styles.item,
                "BodyTextBlockStyle",
                item.danger && styles.danger,
                item.disabled && styles.disabled,
                index === active && styles.itemActive,
              )}
              onClick={() => choose(index)}
              onMouseMove={() => {
                if (!item.disabled && index !== active) setActive(index);
              }}
            >
              {hasIcons && (
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className={styles.label}>{item.label}</span>
              {item.hint && <span className={styles.hint}>{item.hint}</span>}
            </div>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

export default ContextMenu;
