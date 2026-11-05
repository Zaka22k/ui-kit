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
import styles from "./SegmentedControl.module.css";

export type SegmentValue = string | number;
export type SegmentedTrackingMode = "single" | "multiple" | "momentary";
export type SegmentedSize = "small" | "regular" | "large";
export type SegmentedShape = "pill" | "rounded";
export type SegmentedAppearance = "neutral" | "accent";

export interface SegmentItem<T extends SegmentValue = SegmentValue> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
}

interface SegmentedContextValue {
  trackingMode: SegmentedTrackingMode;
  isSelected: (value: SegmentValue) => boolean;
  isDividerHidden: (index: number) => boolean;
  onTrigger: (event: React.SyntheticEvent, value: SegmentValue) => void;
  registerSegment: (
    index: number,
    value: SegmentValue,
    node: HTMLButtonElement | null,
  ) => void;
  setHoveredIndex: (index: number | null) => void;
  setPressedValue: (value: SegmentValue | null) => void;
  pressedValue: SegmentValue | null;
  thumbRadius: number;
  disabled?: boolean;
  consumeDragFlag: () => boolean;
}

const SegmentedContext = createContext<SegmentedContextValue | null>(null);

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

export interface SegmentedControlProps<
  T extends SegmentValue = SegmentValue,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  items?: readonly SegmentItem<T>[];
  children?: ReactNode;
  trackingMode?: SegmentedTrackingMode;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T, event: React.SyntheticEvent) => void;
  values?: readonly T[];
  defaultValues?: readonly T[];
  onValuesChange?: (values: T[], event: React.SyntheticEvent) => void;
  onSegmentInvoke?: (value: T, event: React.SyntheticEvent) => void;
  equalWidth?: boolean;
  fullWidth?: boolean;
  size?: SegmentedSize;
  shape?: SegmentedShape;
  appearance?: SegmentedAppearance;
  disabled?: boolean;
}
export function SegmentedControl<T extends SegmentValue = SegmentValue>({
  items,
  children,
  trackingMode = "single",
  value: controlledValue,
  defaultValue,
  onValueChange,
  values: controlledValues,
  defaultValues = [],
  onValuesChange,
  onSegmentInvoke,
  equalWidth = true,
  fullWidth = false,
  size = "regular",
  shape = "pill",
  appearance = "neutral",
  disabled = false,
  className,
  style,
  ...rest
}: SegmentedControlProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbGlassRef = useRef<HTMLDivElement>(null);
  const segmentNodesRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const segmentValuesRef = useRef<Map<number, SegmentValue>>(new Map());
  const prevActiveRef = useRef<T | undefined>(undefined);

  const [innerSingle, setInnerSingle] = useState<T | undefined>(defaultValue);
  const isSingleControlled = controlledValue !== undefined;
  const activeSingle = isSingleControlled ? controlledValue : innerSingle;

  const [innerMulti, setInnerMulti] = useState<readonly T[]>(defaultValues);
  const isMultiControlled = controlledValues !== undefined;
  const activeMulti = isMultiControlled ? controlledValues : innerMulti;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressedValue, setPressedValue] = useState<SegmentValue | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  // Состояние перетаскивания (drag / scrub)
  const [dragThumbRect, setDragThumbRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const didDragRef = useRef(false);

  const [thumbRect, setThumbRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [thumbReady, setThumbReady] = useState(false);

  const isSelected = useCallback(
    (val: SegmentValue): boolean => {
      if (trackingMode === "momentary") return pressedValue === val;
      if (trackingMode === "multiple") return activeMulti.includes(val as T);
      return activeSingle === val;
    },
    [trackingMode, pressedValue, activeMulti, activeSingle],
  );

  // Активируем стеклянную линзу в момент переключения сегмента
  useEffect(() => {
    if (
      prevActiveRef.current !== undefined &&
      prevActiveRef.current !== activeSingle &&
      thumbReady
    ) {
      setIsMoving(true);
      const timer = window.setTimeout(() => {
        setIsMoving(false);
      }, 280);
      prevActiveRef.current = activeSingle;
      return () => window.clearTimeout(timer);
    }
    prevActiveRef.current = activeSingle;
  }, [activeSingle, thumbReady]);

  const updateThumbGeometry = useCallback(() => {
    if (trackingMode !== "single") {
      setThumbRect((prev) => (prev === null ? null : null));
      return;
    }
    let targetEl: HTMLButtonElement | undefined;
    for (const [idx, val] of segmentValuesRef.current.entries()) {
      if (val === activeSingle) {
        targetEl = segmentNodesRef.current.get(idx);
        break;
      }
    }
    if (!targetEl) {
      setThumbRect((prev) => (prev === null ? null : null));
      return;
    }
    const nextLeft = targetEl.offsetLeft;
    const nextWidth = targetEl.offsetWidth;

    // Обновляем стейт ТОЛЬКО если координаты реально изменились
    setThumbRect((prev) => {
      if (prev && prev.left === nextLeft && prev.width === nextWidth) {
        return prev;
      }
      return { left: nextLeft, width: nextWidth };
    });
  }, [trackingMode, activeSingle]);

  // 1. Вычисляем геометрию без циклических зависимостей (без thumbRect и children)
  useIsoLayoutEffect(() => {
    updateThumbGeometry();
  }, [updateThumbGeometry, items, equalWidth, fullWidth, size]);

  // 2. Включаем плавную CSS-анимацию только один раз после первого появления ползунка
  useEffect(() => {
    if (!thumbReady && thumbRect !== null) {
      const id = requestAnimationFrame(() => setThumbReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [thumbReady, thumbRect]);

  useIsoLayoutEffect(() => {
    updateThumbGeometry();
    if (!thumbReady && thumbRect !== null) {
      const id = requestAnimationFrame(() => setThumbReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [
    updateThumbGeometry,
    items,
    children,
    equalWidth,
    fullWidth,
    size,
    thumbReady,
    thumbRect,
  ]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateThumbGeometry());
    ro.observe(root);
    segmentNodesRef.current.forEach((node) => ro.observe(node));
    return () => ro.disconnect();
  }, [updateThumbGeometry]);
  const registerSegment = useCallback(
    (index: number, val: SegmentValue, node: HTMLButtonElement | null) => {
      if (node) {
        segmentNodesRef.current.set(index, node);
        segmentValuesRef.current.set(index, val);
      } else {
        segmentNodesRef.current.delete(index);
        segmentValuesRef.current.delete(index);
      }
    },
    [],
  );

  const isDividerHidden = useCallback(
    (index: number): boolean => {
      if (index === 0) return true;
      let curVal: SegmentValue | undefined;
      let prevVal: SegmentValue | undefined;

      if (items) {
        curVal = items[index]?.value;
        prevVal = items[index - 1]?.value;
      } else {
        curVal = segmentValuesRef.current.get(index);
        prevVal = segmentValuesRef.current.get(index - 1);
      }

      const curActive = curVal !== undefined && isSelected(curVal);
      const prevActive = prevVal !== undefined && isSelected(prevVal);
      const curHovered = hoveredIndex === index || hoveredIndex === index - 1;
      return curActive || prevActive || curHovered;
    },
    [items, isSelected, hoveredIndex],
  );

  const onTrigger = useCallback(
    (event: React.SyntheticEvent, val: SegmentValue) => {
      const typedVal = val as T;
      onSegmentInvoke?.(typedVal, event);

      if (trackingMode === "single") {
        if (typedVal !== activeSingle) {
          if (!isSingleControlled) setInnerSingle(typedVal);
          onValueChange?.(typedVal, event);
        }
      } else if (trackingMode === "multiple") {
        const exists = activeMulti.includes(typedVal);
        const next = exists
          ? activeMulti.filter((item) => item !== typedVal)
          : [...activeMulti, typedVal];
        if (!isMultiControlled) setInnerMulti(next);
        onValuesChange?.(next, event);
      }
    },
    [
      trackingMode,
      activeSingle,
      isSingleControlled,
      onValueChange,
      activeMulti,
      isMultiControlled,
      onValuesChange,
      onSegmentInvoke,
    ],
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
    if (!glass || trackingMode !== "single" || disabled) return;

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

  // Плавное ведение стеклянной линзы за курсором/пальцем (Scrubbing)
  const handleRootPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    forwardPointerToThumb(e, "down");
    if (disabled || trackingMode !== "single" || e.button !== 0) return;

    const root = rootRef.current;
    if (!root) return;

    const ordered = Array.from(segmentNodesRef.current.entries())
      .sort(([a], [b]) => a - b)
      .map(([idx, el]) => ({
        idx,
        el,
        val: segmentValuesRef.current.get(idx),
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

      // Интерполируем ширину и позицию ползунка между центрами первого и последнего сегментов
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

      // Определяем ближайший доступный сегмент под центром линзы
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
        onTrigger(moveEvent as unknown as React.SyntheticEvent, closest.val);
      }
    };

    const handleWindowUp = () => {
      window.removeEventListener("pointermove", handleWindowMove);
      window.removeEventListener("pointerup", handleWindowUp);
      window.removeEventListener("pointercancel", handleWindowUp);

      if (dragging) {
        setDragThumbRect(null);
        setPressedValue(null);
        // Сохраняем стеклянное состояние на время доводки в паз
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

    const ordered = Array.from(segmentNodesRef.current.entries())
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

    if (trackingMode === "single") {
      const targetVal = items
        ? items[targetIndex]?.value
        : segmentValuesRef.current.get(targetIndex);
      if (targetVal !== undefined) {
        onTrigger(event, targetVal);
      }
    }
  };
  const thumbRadius = shape === "pill" ? 9999 : 6;
  const isDragging = dragThumbRect !== null;
  const isTransitioning = isMoving || pressedValue !== null || isDragging;
  const displayRect = dragThumbRect ?? thumbRect;

  const ctx = useMemo<SegmentedContextValue>(
    () => ({
      trackingMode,
      isSelected,
      isDividerHidden,
      onTrigger,
      registerSegment,
      setHoveredIndex,
      setPressedValue,
      pressedValue,
      thumbRadius,
      disabled,
      consumeDragFlag,
    }),
    [
      trackingMode,
      isSelected,
      isDividerHidden,
      onTrigger,
      registerSegment,
      pressedValue,
      thumbRadius,
      disabled,
      consumeDragFlag,
    ],
  );

  const renderedChildren = items
    ? items.map((item, idx) => (
        <Segment
          key={String(item.value)}
          index={idx}
          value={item.value}
          icon={item.icon}
          disabled={item.disabled}
          tooltip={item.tooltip}
          aria-label={item.ariaLabel}
        >
          {item.label}
        </Segment>
      ))
    : React.Children.map(children, (child, idx) =>
        React.isValidElement<SegmentProps>(child)
          ? React.cloneElement(child, { index: idx })
          : child,
      );

  const role =
    trackingMode === "single"
      ? "radiogroup"
      : trackingMode === "multiple"
        ? "group"
        : "toolbar";

  return (
    <SegmentedContext.Provider value={ctx}>
      <div
        {...rest}
        ref={rootRef}
        role={role}
        aria-disabled={disabled || undefined}
        className={cx(
          styles.root,
          !equalWidth && styles.autoWidth,
          fullWidth && styles.fullWidth,
          shape === "rounded" && styles.rounded,
          size === "small" && styles.small,
          size === "large" && styles.large,
          appearance === "accent" && styles.accent,
          className,
        )}
        style={style}
        onKeyDown={handleKeyDown}
        onPointerEnter={(e) => forwardPointerToThumb(e, "enter")}
        onPointerMove={(e) => forwardPointerToThumb(e, "move")}
        onPointerLeave={(e) => forwardPointerToThumb(e, "leave")}
        onPointerDown={handleRootPointerDown}
      >
        {trackingMode === "single" && displayRect && (
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
                radius={thumbRadius}
                interactive={!disabled}
                className={styles.thumbGlass}
              />
            </div>
          </div>
        )}
        {renderedChildren}
      </div>
    </SegmentedContext.Provider>
  );
}

export interface SegmentProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "onSelect"
> {
  value: SegmentValue;
  icon?: ReactNode;
  disabled?: boolean;
  tooltip?: string;
  children?: ReactNode;
  index?: number;
}

export function Segment({
  value,
  icon,
  disabled: itemDisabled,
  tooltip,
  children,
  index = 0,
  className,
  onClick,
  onPointerDown,
  ...rest
}: SegmentProps) {
  const ctx = useContext(SegmentedContext);
  if (!ctx) {
    throw new Error(
      "<Segment> должен использоваться внутри <SegmentedControl>",
    );
  }

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const isDisabled = Boolean(ctx.disabled || itemDisabled);
  const selected = ctx.isSelected(value);
  const hideDivider = ctx.isDividerHidden(index);

  useIsoLayoutEffect(() => {
    ctx.registerSegment(index, value, btnRef.current);
    return () => ctx.registerSegment(index, value, null);
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
      ctx.onTrigger(e, value);
    }
  };

  const isSingle = ctx.trackingMode === "single";
  const isMultiple = ctx.trackingMode === "multiple";
  const tabIndex = isDisabled ? -1 : isSingle ? (selected ? 0 : -1) : 0;

  return (
    <button
      {...rest}
      ref={btnRef}
      type="button"
      role={isSingle ? "radio" : "button"}
      aria-checked={isSingle ? selected : undefined}
      aria-pressed={isMultiple ? selected : undefined}
      disabled={isDisabled}
      tabIndex={tabIndex}
      title={
        tooltip ??
        (typeof children === "string" && !icon
          ? undefined
          : typeof children === "string"
            ? children
            : undefined)
      }
      className={cx(
        styles.segment,
        selected && styles.selected,
        hideDivider && styles.dividerHidden,
        isDisabled && styles.disabled,
        className,
      )}
      onPointerEnter={() => ctx.setHoveredIndex(index)}
      onPointerLeave={() => ctx.setHoveredIndex(null)}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      {!isSingle && selected && (
        <span aria-hidden="true" className={styles.segmentGlassWrap}>
          <span className={styles.thumbRestingFill} />
          <FrostedGlass
            width="100%"
            height="100%"
            radius={ctx.thumbRadius}
            interactive={!isDisabled}
            className={styles.segmentGlass}
          />
        </span>
      )}
      {icon && <span className={styles.icon}>{icon}</span>}
      {children !== undefined && children !== null && (
        <span className={styles.label}>{children}</span>
      )}
    </button>
  );
}
