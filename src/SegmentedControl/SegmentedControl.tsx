"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode, HTMLAttributes } from "react";
import { FrostedGlass } from "../FrostedGlass";
import {
  SegmentedContext,
  type SegmentItem,
  type SegmentValue,
} from "./SegmentedControlTypes";
import styles from "./SegmentedControl.module.css";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface SegmentedControlProps<
  T extends SegmentValue = SegmentValue,
> extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  items?: readonly SegmentItem<T>[];
  children?: ReactNode;

  value?: T;
  defaultValue?: T;
  onValueChange?: (val: T) => void;

  values?: T[];
  defaultValues?: T[];
  onValuesChange?: (vals: T[]) => void;

  variant?: "solid" | "glass" | "pills";
  layout?: "inline" | "stacked";
  appearance?: "neutral" | "accent";

  fullWidth?: boolean;
  equalWidth?: boolean;
  disabled?: boolean;
}

export function SegmentedControl<T extends SegmentValue = SegmentValue>({
  items,
  children,
  value: controlledVal,
  defaultValue,
  onValueChange,
  values: controlledVals,
  defaultValues = [],
  onValuesChange,

  variant = "solid",
  layout = "inline",
  appearance = "neutral",
  fullWidth = false,
  equalWidth = true,
  disabled = false,
  className,
  style,
  ...rest
}: SegmentedControlProps<T>) {
  const isMultiple =
    controlledVals !== undefined || onValuesChange !== undefined;

  const [innerVal, setInnerVal] = useState<T | undefined>(defaultValue);
  const activeSingle = controlledVal !== undefined ? controlledVal : innerVal;

  const [innerMult, setInnerMult] = useState<T[]>(defaultValues);
  const activeMult = controlledVals !== undefined ? controlledVals : innerMult;

  const rootRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Map<SegmentValue, HTMLButtonElement>>(new Map());

  const [thumbRect, setThumbRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [thumbReady, setThumbReady] = useState(false);

  const prevValRef = useRef(activeSingle);

  const registerNode = useCallback(
    (val: SegmentValue, node: HTMLButtonElement | null) => {
      if (node) nodesRef.current.set(val, node);
      else nodesRef.current.delete(val);
    },
    [],
  );

  const handleTrigger = useCallback(
    (e: React.SyntheticEvent, val: SegmentValue) => {
      const tVal = val as T;
      if (isMultiple) {
        const exists = activeMult.includes(tVal);
        const next = exists
          ? activeMult.filter((v) => v !== tVal)
          : [...activeMult, tVal];
        if (controlledVals === undefined) setInnerMult(next);
        onValuesChange?.(next);
      } else {
        if (tVal !== activeSingle) {
          if (controlledVal === undefined) setInnerVal(tVal);
          onValueChange?.(tVal);
        }
      }
    },
    [
      isMultiple,
      activeMult,
      activeSingle,
      controlledVals,
      controlledVal,
      onValuesChange,
      onValueChange,
    ],
  );

  const updateThumb = useCallback(() => {
    if (isMultiple || activeSingle === undefined) {
      setThumbRect(null);
      return;
    }
    const node = nodesRef.current.get(activeSingle);
    if (!node) return;
    setThumbRect({ left: node.offsetLeft, width: node.offsetWidth });
  }, [isMultiple, activeSingle, items]);

  useIsoLayoutEffect(() => {
    updateThumb();
  }, [updateThumb, layout, fullWidth, equalWidth]);

  useEffect(() => {
    if (prevValRef.current !== activeSingle && thumbReady) {
      setIsMoving(true);
      const t = setTimeout(() => setIsMoving(false), 300);
      return () => clearTimeout(t);
    }
    prevValRef.current = activeSingle;
  }, [activeSingle, thumbReady]);

  useEffect(() => {
    if (thumbRect && !thumbReady) {
      requestAnimationFrame(() => setThumbReady(true));
    }
  }, [thumbRect, thumbReady]);

  useEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver(() => updateThumb());
    ro.observe(rootRef.current);
    nodesRef.current.forEach((node) => ro.observe(node));
    return () => ro.disconnect();
  }, [updateThumb]);

  const ctx = useMemo(
    () => ({
      activeValue: activeSingle,
      selectedValues: activeMult,
      isMultiple,
      onTrigger: handleTrigger,
      registerNode,
      disabled,
    }),
    [
      activeSingle,
      activeMult,
      isMultiple,
      handleTrigger,
      registerNode,
      disabled,
    ],
  );

  const content = items
    ? items.map((item) => <Segment key={item.value} {...item} />)
    : children;

  const isGlass = variant === "glass";

  const wrapperClass = [
    styles.root,
    styles[variant],
    styles[layout],
    appearance === "accent" && styles.accent,
    fullWidth && styles.fullWidth,
    !equalWidth && styles.autoWidth,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const RootTag = isGlass ? FrostedGlass : "div";
  const rootProps = isGlass
    ? {
        tint: "var(--fill-tertiary)",
        radius: 9999,
        interactive: false,
        width: fullWidth ? "100%" : "auto",
        height: "36px",
      }
    : {};

  return (
    <SegmentedContext.Provider value={ctx}>
      <RootTag
        {...rest}
        {...rootProps}
        ref={rootRef}
        className={wrapperClass}
        role={isMultiple ? "group" : "radiogroup"}
      >
        {!isMultiple && thumbRect && (
          <div
            className={`
              ${styles.thumbTrack} 
              ${!thumbReady ? styles.thumbNoAnim : ""}
              ${isMoving ? styles.thumbMoving : ""}
            `}
            style={{
              transform: `translateX(${thumbRect.left}px)`,
              width: thumbRect.width,
            }}
          >
            <div className={styles.thumbContent}>
              {isGlass && (
                <FrostedGlass
                  width="100%"
                  height="100%"
                  radius={9999}
                  tint="var(--fill-primary)"
                  interactive={false}
                />
              )}
            </div>
          </div>
        )}

        {content}
      </RootTag>
    </SegmentedContext.Provider>
  );
}

// === SEGMENT ===

export interface SegmentProps extends Omit<
  HTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  value: SegmentValue;
  label?: ReactNode;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  // badge удален
  disabled?: boolean;
  tooltip?: string;
  children?: ReactNode;
}

export function Segment({
  value,
  label,
  icon,
  activeIcon,
  // badge удален
  disabled,
  tooltip,
  children,
  className,
  ...rest
}: SegmentProps) {
  const ctx = useContext(SegmentedContext);
  if (!ctx) throw new Error("Segment must be used within SegmentedControl");

  const ref = useRef<HTMLButtonElement>(null);

  const isSelected = ctx.isMultiple
    ? ctx.selectedValues.includes(value)
    : ctx.activeValue === value;

  useIsoLayoutEffect(() => {
    ctx.registerNode(value, ref.current);
    return () => ctx.registerNode(value, null);
  }, [value]);

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || ctx.disabled) return;
    ctx.onTrigger(e, value);
  };

  const currentIcon = isSelected && activeIcon ? activeIcon : icon;
  const content = children || label;

  return (
    <button
      ref={ref}
      type="button"
      role={ctx.isMultiple ? "button" : "radio"}
      aria-checked={isSelected}
      aria-pressed={ctx.isMultiple ? isSelected : undefined}
      disabled={disabled || ctx.disabled}
      title={tooltip}
      className={`
        ${styles.segment} 
        ${isSelected ? styles.selected : ""}
        ${disabled ? styles.disabled : ""}
        ${className || ""}
      `}
      onClick={handleClick}
      {...rest}
    >
      {currentIcon && <span className={styles.iconWrap}>{currentIcon}</span>}

      {content && <span>{content}</span>}

      {ctx.isMultiple && isSelected && (
        <div style={{ position: "absolute", inset: 0, zIndex: -1 }}>
          <FrostedGlass
            width="100%"
            height="100%"
            tint="var(--fill-secondary)"
            radius={9999}
            interactive={false}
          />
        </div>
      )}
    </button>
  );
}
