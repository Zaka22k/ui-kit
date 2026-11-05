"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { FrostedGlass } from "../FrostedGlass";
import styles from "./TabBar.module.css";

export type TabValue = string | number;
export type TabBarLayout = "stacked" | "inline";

export interface TabBarItem<T extends TabValue = TabValue> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  disabled?: boolean;
  badge?: number | string;
  ariaLabel?: string;
}

interface TabBarContextValue {
  layout: TabBarLayout;
  isSelected: (value: TabValue) => boolean;
  onSelect: (event: React.SyntheticEvent, value: TabValue) => void;
  registerTab: (
    index: number,
    value: TabValue,
    node: HTMLButtonElement | null,
  ) => void;
  setPressedValue: (value: TabValue | null) => void;
  consumeDragFlag: () => boolean;
  disabled?: boolean;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export interface TabBarProps<T extends TabValue = TabValue> extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange" | "defaultValue"
> {
  items?: readonly TabBarItem<T>[];
  children?: ReactNode;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T, event: React.SyntheticEvent) => void;
  layout?: TabBarLayout;
  accentSelected?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
}
export function TabBar<T extends TabValue = TabValue>({
  items,
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
  layout: layoutProp,
  accentSelected,
  fullWidth = false,
  disabled = false,
  className,
  style,
  ...rest
}: TabBarProps<T>) {
  const rootGlassRef = useRef<HTMLDivElement>(null);
  const thumbGlassRef = useRef<HTMLDivElement>(null);
  const tabNodesRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const tabValuesRef = useRef<Map<number, TabValue>>(new Map());
  const prevActiveRef = useRef<T | undefined>(undefined);

  const hasIconsInItems = useMemo(
    () => Boolean(items?.some((item) => item.icon || item.activeIcon)),
    [items],
  );
  const resolvedLayout: TabBarLayout =
    layoutProp ?? (hasIconsInItems ? "stacked" : "inline");

  const useAccentText = accentSelected ?? resolvedLayout === "stacked";

  const [innerValue, setInnerValue] = useState<T | undefined>(
    defaultValue ?? items?.find((i) => !i.disabled)?.value,
  );
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : innerValue;

  const [pressedValue, setPressedValue] = useState<TabValue | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const [thumbRect, setThumbRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [dragThumbRect, setDragThumbRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [thumbReady, setThumbReady] = useState(false);
  const didDragRef = useRef(false);

  const isSelected = useCallback(
    (val: TabValue) => activeValue === val,
    [activeValue],
  );

  useEffect(() => {
    if (
      prevActiveRef.current !== undefined &&
      prevActiveRef.current !== activeValue &&
      thumbReady
    ) {
      setIsMoving(true);
      const timer = window.setTimeout(() => setIsMoving(false), 260);
      prevActiveRef.current = activeValue;
      return () => window.clearTimeout(timer);
    }
    prevActiveRef.current = activeValue;
  }, [activeValue, thumbReady]);

  const updateThumbGeometry = useCallback(() => {
    let targetEl: HTMLButtonElement | undefined;
    for (const [idx, val] of tabValuesRef.current.entries()) {
      if (val === activeValue) {
        targetEl = tabNodesRef.current.get(idx);
        break;
      }
    }
    if (!targetEl) {
      setThumbRect((prev) => (prev === null ? null : null));
      return;
    }
    const nextLeft = targetEl.offsetLeft;
    const nextWidth = targetEl.offsetWidth;

    setThumbRect((prev) => {
      if (prev && prev.left === nextLeft && prev.width === nextWidth) {
        return prev;
      }
      return { left: nextLeft, width: nextWidth };
    });
  }, [activeValue]);

  useIsoLayoutEffect(() => {
    updateThumbGeometry();
  }, [updateThumbGeometry, items, resolvedLayout, fullWidth]);

  useEffect(() => {
    if (!thumbReady && thumbRect !== null) {
      const id = requestAnimationFrame(() => setThumbReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [thumbReady, thumbRect]);

  useEffect(() => {
    const root = rootGlassRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateThumbGeometry());
    ro.observe(root);
    tabNodesRef.current.forEach((node) => ro.observe(node));
    return () => ro.disconnect();
  }, [updateThumbGeometry]);
  const registerTab = useCallback(
    (index: number, val: TabValue, node: HTMLButtonElement | null) => {
      if (node) {
        tabNodesRef.current.set(index, node);
        tabValuesRef.current.set(index, val);
      } else {
        tabNodesRef.current.delete(index);
        tabValuesRef.current.delete(index);
      }
    },
    [],
  );

  const onSelect = useCallback(
    (event: React.SyntheticEvent, val: TabValue) => {
      const typedVal = val as T;
      if (typedVal !== activeValue) {
        if (!isControlled) setInnerValue(typedVal);
        onValueChange?.(typedVal, event);
      }
    },
    [activeValue, isControlled, onValueChange],
  );

  const consumeDragFlag = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return true;
    }
    return false;
  }, []);

  const forwardPointerToThumb = (
    e: { clientX: number; clientY: number; pointerType?: string },
    type: "enter" | "move" | "leave" | "down",
  ) => {
    const glass = thumbGlassRef.current;
    if (!glass || disabled) return;

    const rect = glass.getBoundingClientRect();
    const scale = rect.width / (glass.offsetWidth || 1) || 1;
    glass.style.setProperty(
      "--fg-pointer-x",
      `${(e.clientX - rect.left) / scale}px`,
    );
    glass.style.setProperty(
      "--fg-pointer-y",
      `${(e.clientY - rect.top) / scale}px`,
    );

    if (type === "down" || type === "enter" || type === "leave") {
      const eventName =
        type === "down"
          ? "pointerdown"
          : type === "enter"
            ? "pointerenter"
            : "pointerleave";
      glass.dispatchEvent(
        new PointerEvent(eventName, {
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType: e.pointerType,
          bubbles: false,
        }),
      );
    }
  };

  const handleRootPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    forwardPointerToThumb(e, "down");
    if (disabled || e.button !== 0) return;

    const root = rootGlassRef.current;
    if (!root) return;

    const ordered = Array.from(tabNodesRef.current.entries())
      .sort(([a], [b]) => a - b)
      .map(([idx, el]) => ({
        idx,
        el,
        val: tabValuesRef.current.get(idx),
        disabled: el.disabled,
        left: el.offsetLeft,
        width: el.offsetWidth,
        center: el.offsetLeft + el.offsetWidth / 2,
      }));

    if (ordered.length === 0) return;

    const startX = e.clientX;
    let dragging = false;
    didDragRef.current = false;

    const handleWindowMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      if (!dragging && Math.abs(dx) > 3) {
        dragging = true;
        didDragRef.current = true;
      }
      if (!dragging) return;

      const rootRect = root.getBoundingClientRect();
      const pointerX = moveEvent.clientX - rootRect.left;

      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const clampedCenter = Math.max(
        first.center,
        Math.min(last.center, pointerX),
      );

      let interpWidth = first.width;
      for (let i = 0; i < ordered.length - 1; i++) {
        const cur = ordered[i];
        const next = ordered[i + 1];
        if (clampedCenter >= cur.center && clampedCenter <= next.center) {
          const t =
            (clampedCenter - cur.center) /
            Math.max(1, next.center - cur.center);
          interpWidth = cur.width + (next.width - cur.width) * t;
          break;
        }
      }

      const minLeft = first.left;
      const maxLeft = last.left + last.width - interpWidth;
      const nextLeft = Math.max(
        minLeft,
        Math.min(maxLeft, pointerX - interpWidth / 2),
      );

      setDragThumbRect({ left: nextLeft, width: interpWidth });
      forwardPointerToThumb(moveEvent, "move");

      let closest = ordered[0];
      let minDist = Infinity;
      for (const item of ordered) {
        if (item.disabled) continue;
        const dist = Math.abs(pointerX - item.center);
        if (dist < minDist) {
          minDist = dist;
          closest = item;
        }
      }

      if (closest && closest.val !== undefined) {
        setPressedValue(closest.val);
        onSelect(moveEvent as unknown as React.SyntheticEvent, closest.val);
      }
    };

    const handleWindowUp = () => {
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("pointerup", handleWindowUp);
      window.removeEventListener("pointercancel", handleWindowUp);

      if (dragging) {
        setDragThumbRect(null);
        setPressedValue(null);
        setIsMoving(true);
        window.setTimeout(() => setIsMoving(false), 240);
      }
    };

    window.addEventListener("pointermove", handleWindowMove);
    window.addEventListener("pointerup", handleWindowUp);
    window.addEventListener("pointercancel", handleWindowUp);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || disabled) return;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

    const ordered = Array.from(tabNodesRef.current.entries())
      .sort(([a], [b]) => a - b)
      .filter(([, el]) => !el.disabled);

    if (ordered.length === 0) return;

    const currentPos = ordered.findIndex(
      ([, el]) => el === document.activeElement,
    );
    let nextPos = 0;

    if (event.key === "Home") nextPos = 0;
    else if (event.key === "End") nextPos = ordered.length - 1;
    else if (event.key === "ArrowRight") {
      nextPos = currentPos < 0 ? 0 : (currentPos + 1) % ordered.length;
    } else if (event.key === "ArrowLeft") {
      nextPos =
        currentPos < 0
          ? ordered.length - 1
          : (currentPos - 1 + ordered.length) % ordered.length;
    }

    event.preventDefault();
    const [targetIndex, targetEl] = ordered[nextPos];
    targetEl.focus();

    const targetVal = items
      ? items[targetIndex]?.value
      : tabValuesRef.current.get(targetIndex);
    if (targetVal !== undefined) {
      onSelect(event, targetVal);
    }
  };

  const isDragging = dragThumbRect !== null;
  const isTransitioning = isMoving || pressedValue !== null || isDragging;
  const displayRect = dragThumbRect ?? thumbRect;

  const ctx = useMemo<TabBarContextValue>(
    () => ({
      layout: resolvedLayout,
      isSelected,
      onSelect,
      registerTab,
      setPressedValue,
      consumeDragFlag,
      disabled,
    }),
    [
      resolvedLayout,
      isSelected,
      onSelect,
      registerTab,
      consumeDragFlag,
      disabled,
    ],
  );

  const renderedChildren = items
    ? items.map((item, idx) => (
        <Tab
          key={String(item.value)}
          index={idx}
          value={item.value}
          icon={item.icon}
          activeIcon={item.activeIcon}
          badge={item.badge}
          disabled={item.disabled}
          aria-label={item.ariaLabel}
        >
          {item.label}
        </Tab>
      ))
    : React.Children.map(children, (child, idx) =>
        React.isValidElement<TabProps>(child)
          ? React.cloneElement(child, { index: idx })
          : child,
      );

  return (
    <TabBarContext.Provider value={ctx}>
      <FrostedGlass
        {...rest}
        ref={rootGlassRef}
        role="tablist"
        aria-disabled={disabled || undefined}
        width={fullWidth ? "100%" : "auto"}
        height="auto"
        radius={9999}
        tint="var(--fill-tertiary)"
        interactive
        className={cx(
          styles.root,
          resolvedLayout === "stacked" ? styles.stacked : styles.inline,
          useAccentText && styles.accentSelected,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          className,
        )}
        style={style}
        onKeyDown={handleKeyDown}
        onPointerEnter={(e) => forwardPointerToThumb(e, "enter")}
        onPointerMove={(e) => forwardPointerToThumb(e, "move")}
        onPointerLeave={(e) => forwardPointerToThumb(e, "leave")}
        onPointerDown={handleRootPointerDown}
      >
        {displayRect && (
          <div
            aria-hidden="true"
            className={cx(
              styles.thumbTrack,
              (!thumbReady || isDragging) && styles.thumbNoAnim,
              isTransitioning && styles.thumbTransitioning,
            )}
            style={{
              width: `${displayRect.width}px`,
              transform: `translate3d(${displayRect.left}px, 0, 0)`,
            }}
          >
            <div className={styles.thumbMorph}>
              <span className={styles.thumbRestingFill} />
              <FrostedGlass
                ref={thumbGlassRef}
                width="100%"
                height="100%"
                radius={9999}
                tint="var(--fill-primary)"
                interactive={!disabled}
                className={styles.thumbGlass}
              />
            </div>
          </div>
        )}
        {renderedChildren}
      </FrostedGlass>
    </TabBarContext.Provider>
  );
}

export interface TabProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "onSelect"
> {
  value: TabValue;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
  children?: ReactNode;
  index?: number;
}

export function Tab({
  value,
  icon,
  activeIcon,
  badge,
  disabled: itemDisabled,
  children,
  index = 0,
  className,
  onClick,
  onPointerDown,
  ...rest
}: TabProps) {
  const ctx = useContext(TabBarContext);
  if (!ctx) {
    throw new Error("<Tab> должен использоваться внутри <TabBar>");
  }

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const isDisabled = Boolean(ctx.disabled || itemDisabled);
  const selected = ctx.isSelected(value);

  useIsoLayoutEffect(() => {
    ctx.registerTab(index, value, btnRef.current);
    return () => ctx.registerTab(index, value, null);
  }, [ctx, index, value]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    ctx.setPressedValue(value);
    const up = () => {
      ctx.setPressedValue(null);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    onPointerDown?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (ctx.consumeDragFlag()) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
    if (!e.defaultPrevented) {
      ctx.onSelect(e, value);
    }
  };

  const renderedIcon = selected && activeIcon ? activeIcon : icon;

  return (
    <button
      {...rest}
      ref={btnRef}
      type="button"
      role="tab"
      aria-selected={selected}
      disabled={isDisabled}
      tabIndex={isDisabled ? -1 : selected ? 0 : -1}
      className={cx(
        styles.tab,
        selected && styles.selected,
        isDisabled && styles.tabDisabled,
        className,
      )}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {renderedIcon && (
        <span className={styles.iconWrap}>
          <span className={styles.icon}>{renderedIcon}</span>
          {badge !== undefined && (
            <span className={`${styles.badge} CaptionTextBlockStyle`}>
              {badge}
            </span>
          )}
        </span>
      )}
      {children !== undefined && children !== null && (
        <span className={styles.label}>{children}</span>
      )}
    </button>
  );
}

export default TabBar;
