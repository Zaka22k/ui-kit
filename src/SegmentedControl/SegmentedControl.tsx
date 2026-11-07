"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  Ref,
} from "react";
import { FrostedGlass } from "../FrostedGlass";
import { cx } from "../utils/cx";
import { useForwardedRef } from "../utils/useForwardedRef";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";
import {
  SegmentedContext,
  type SegmentItem,
  type SegmentValue,
  type SegmentVariant,
} from "./SegmentedControlTypes";
import styles from "./SegmentedControl.module.css";

const hasContent = (node: ReactNode): boolean =>
  node !== undefined && node !== null && node !== false && node !== "";

export interface SegmentedControlProps<T extends SegmentValue = SegmentValue>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Segments as data. Without it, pass `<Segment>` children. / Сегменты данными. Без него передайте `<Segment>` в children. */
  items?: readonly SegmentItem<T>[];
  children?: ReactNode;

  /** Selected value, single mode (controlled). / Выбранное значение, одиночный режим (контролируемый). */
  value?: T;
  /** Initial value, single mode. / Начальное значение, одиночный режим. */
  defaultValue?: T;
  /** Called when the selection changes, single mode. / Вызывается при смене выбора, одиночный режим. */
  onValueChange?: (val: T) => void;

  /** Selected values, multiple mode (controlled). / Выбранные значения, множественный режим (контролируемый). */
  values?: T[];
  /** Initial values; enables multiple mode. / Начальные значения; включает множественный режим. */
  defaultValues?: T[];
  /** Called when the selection changes, multiple mode. / Вызывается при смене выбора, множественный режим. */
  onValuesChange?: (vals: T[]) => void;

  variant?: SegmentVariant;
  layout?: "inline" | "stacked";
  appearance?: "neutral" | "accent";

  fullWidth?: boolean;
  equalWidth?: boolean;
  disabled?: boolean;

  /** Ref of the root element. / Ref корневого элемента. */
  ref?: Ref<HTMLDivElement>;
}

export function SegmentedControl<T extends SegmentValue = SegmentValue>({
  items,
  children,
  value: controlledVal,
  defaultValue,
  onValueChange,
  values: controlledVals,
  defaultValues,
  onValuesChange,

  variant = "solid",
  layout = "inline",
  appearance = "neutral",
  fullWidth = false,
  equalWidth = true,
  disabled = false,
  className,
  style,
  onKeyDown,
  ref: forwardedRef,
  ...rest
}: SegmentedControlProps<T>) {
  const isMultiple =
    controlledVals !== undefined ||
    defaultValues !== undefined ||
    onValuesChange !== undefined;

  const [innerVal, setInnerVal] = useState<T | undefined>(defaultValue);
  const activeSingle = controlledVal !== undefined ? controlledVal : innerVal;

  const [innerMult, setInnerMult] = useState<T[]>(defaultValues ?? []);
  const activeMult = controlledVals !== undefined ? controlledVals : innerMult;

  const { ref: rootRef, setRefs } = useForwardedRef<HTMLDivElement>(
    (forwardedRef ?? null) as ForwardedRef<HTMLDivElement>,
  );
  const nodesRef = useRef<Map<SegmentValue, HTMLButtonElement>>(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);

  const [thumbRect, setThumbRect] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [thumbReady, setThumbReady] = useState(false);
  const [tabStop, setTabStop] = useState<SegmentValue | undefined>(
    activeSingle,
  );

  const prevValRef = useRef(activeSingle);

  const registerNode = useCallback(
    (val: SegmentValue, node: HTMLButtonElement | null) => {
      if (node) {
        nodesRef.current.set(val, node);
        observerRef.current?.observe(node);
      } else {
        const old = nodesRef.current.get(val);
        if (old) observerRef.current?.unobserve(old);
        nodesRef.current.delete(val);
      }
    },
    [],
  );

  const handleTrigger = useCallback(
    (val: SegmentValue) => {
      const tVal = val as T;
      if (isMultiple) {
        const exists = activeMult.includes(tVal);
        const next = exists
          ? activeMult.filter((v) => v !== tVal)
          : [...activeMult, tVal];
        if (controlledVals === undefined) setInnerMult(next);
        onValuesChange?.(next);
      } else if (tVal !== activeSingle) {
        if (controlledVal === undefined) setInnerVal(tVal);
        onValueChange?.(tVal);
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

  /*
   * The thumb follows the selected segment. The measuring runs after every render and bails out when
   * nothing moved, so a change of children or labels is picked up too.
   * Ползунок следует за выбранным сегментом. Замер идёт после каждого рендера и ничего не обновляет,
   * если положение не изменилось, поэтому смена children или подписей тоже учитывается.
   */
  const updateThumb = () => {
    const node =
      !isMultiple && activeSingle !== undefined
        ? nodesRef.current.get(activeSingle)
        : undefined;
    setThumbRect((prev) => {
      if (!node) return prev === null ? prev : null;
      const left = node.offsetLeft;
      const width = node.offsetWidth;
      return prev && prev.left === left && prev.width === width
        ? prev
        : { left, width };
    });
  };
  const updateThumbRef = useRef(updateThumb);

  useIsomorphicLayoutEffect(() => {
    updateThumbRef.current = updateThumb;
    updateThumb();

    if (isMultiple) return;
    const activeNode =
      activeSingle !== undefined ? nodesRef.current.get(activeSingle) : undefined;
    let target: SegmentValue | undefined;
    if (activeNode && !activeNode.disabled) {
      target = activeSingle;
    } else {
      const first = rootRef.current?.querySelector<HTMLButtonElement>(
        '[role="radio"]:not(:disabled)',
      );
      for (const [val, node] of nodesRef.current) {
        if (node === first) {
          target = val;
          break;
        }
      }
    }
    setTabStop((prev) => (prev === target ? prev : target));
  });

  useEffect(() => {
    if (!thumbReady) {
      prevValRef.current = activeSingle;
      return;
    }
    if (prevValRef.current === activeSingle) return;
    prevValRef.current = activeSingle;
    setIsMoving(true);
    const t = setTimeout(() => setIsMoving(false), 300);
    return () => clearTimeout(t);
  }, [activeSingle, thumbReady]);

  useEffect(() => {
    if (!thumbRect || thumbReady) return;
    const raf = requestAnimationFrame(() => setThumbReady(true));
    return () => cancelAnimationFrame(raf);
  }, [thumbRect, thumbReady]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => updateThumbRef.current());
    observerRef.current = ro;
    ro.observe(root);
    nodesRef.current.forEach((node) => ro.observe(node));
    return () => {
      ro.disconnect();
      observerRef.current = null;
    };
  }, [rootRef]);

  /*
   * Single mode is a radio group: arrows move the focus and the selection, Home and End jump to the ends.
   * Одиночный режим — группа радиокнопок: стрелки двигают фокус и выбор, Home и End — в начало и в конец.
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const root = rootRef.current;
    if (e.defaultPrevented || isMultiple || disabled || !root) return;

    const radios = Array.from(
      root.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)'),
    );
    const current = radios.indexOf(e.target as HTMLButtonElement);
    if (current < 0) return;

    const rtl = getComputedStyle(root).direction === "rtl";
    let next: number;
    switch (e.key) {
      case "ArrowRight":
        next = current + (rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        next = current + (rtl ? 1 : -1);
        break;
      case "ArrowDown":
        next = current + 1;
        break;
      case "ArrowUp":
        next = current - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = radios.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const node = radios[(next + radios.length) % radios.length];
    node.focus();
    node.click();
  };

  const ctx = useMemo(
    () => ({
      activeValue: activeSingle,
      selectedValues: activeMult,
      isMultiple,
      variant,
      tabStop,
      onTrigger: handleTrigger,
      registerNode,
      disabled,
    }),
    [
      activeSingle,
      activeMult,
      isMultiple,
      variant,
      tabStop,
      handleTrigger,
      registerNode,
      disabled,
    ],
  );

  const content = items
    ? items.map((item) => <Segment key={item.value} {...item} />)
    : children;

  const isGlass = variant === "glass";

  const wrapperClass = cx(
    styles.root,
    styles[variant],
    styles[layout],
    appearance === "accent" && styles.accent,
    isMultiple && styles.multiple,
    fullWidth && styles.fullWidth,
    !equalWidth && styles.autoWidth,
    disabled && styles.rootDisabled,
    className,
  );

  const RootTag = isGlass ? FrostedGlass : "div";
  const rootProps = isGlass
    ? {
        tint: "var(--fill-tertiary)",
        radius: 9999,
        interactive: false,
        width: fullWidth ? "100%" : "auto",
        height: layout === "stacked" ? "58px" : "36px",
      }
    : {};

  return (
    <SegmentedContext.Provider value={ctx}>
      <RootTag
        {...rest}
        {...rootProps}
        style={style}
        ref={setRefs}
        className={wrapperClass}
        role={isMultiple ? "group" : "radiogroup"}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
      >
        {!isMultiple && thumbRect && (
          <div
            className={cx(
              styles.thumbTrack,
              !thumbReady && styles.thumbNoAnim,
              isMoving && styles.thumbMoving,
            )}
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

export interface SegmentProps
  extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick"> {
  value: SegmentValue;
  label?: ReactNode;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  disabled?: boolean;
  /** Native tooltip; also the accessible name of an icon-only segment. / Нативная подсказка; для сегмента без текста также его доступное имя. */
  tooltip?: string;
  children?: ReactNode;
}

export function Segment({
  value,
  label,
  icon,
  activeIcon,
  disabled,
  tooltip,
  children,
  className,
  "aria-label": ariaLabel,
  ...rest
}: SegmentProps) {
  const ctx = useContext(SegmentedContext);
  if (!ctx) throw new Error("Segment must be used within SegmentedControl");

  const ref = useRef<HTMLButtonElement>(null);
  const { registerNode } = ctx;

  const isSelected = ctx.isMultiple
    ? ctx.selectedValues.includes(value)
    : ctx.activeValue === value;

  useIsomorphicLayoutEffect(() => {
    registerNode(value, ref.current);
    return () => registerNode(value, null);
  }, [value, registerNode]);

  const handleClick = () => {
    if (disabled || ctx.disabled) return;
    ctx.onTrigger(value);
  };

  const currentIcon = isSelected && hasContent(activeIcon) ? activeIcon : icon;
  const content = hasContent(children) ? children : label;
  const hasText = hasContent(content);

  const button = (
    <button
      ref={ref}
      type="button"
      role={ctx.isMultiple ? undefined : "radio"}
      aria-checked={ctx.isMultiple ? undefined : isSelected}
      aria-pressed={ctx.isMultiple ? isSelected : undefined}
      aria-label={
        ariaLabel ??
        (!hasText && !rest["aria-labelledby"] ? tooltip : undefined)
      }
      tabIndex={
        ctx.isMultiple ? undefined : ctx.tabStop === value ? 0 : -1
      }
      disabled={disabled || ctx.disabled}
      title={tooltip}
      className={cx(
        styles.segment,
        isSelected && styles.selected,
        disabled && styles.disabled,
        className,
      )}
      onClick={handleClick}
      {...rest}
    >
      {hasContent(currentIcon) && (
        <span className={styles.iconWrap}>{currentIcon}</span>
      )}

      {hasText && <span>{content}</span>}
    </button>
  );

  /*
   * In multiple mode every selected segment gets its own glass piece. It lives next to the button,
   * not inside it, because a button may not contain a div.
   * В множественном режиме у каждого выбранного сегмента свой кусочек стекла. Он лежит рядом с кнопкой,
   * а не внутри: в button нельзя вкладывать div.
   */
  if (ctx.isMultiple && ctx.variant !== "pills") {
    return (
      <span className={styles.cell}>
        {isSelected && (
          <span className={styles.cellGlass} aria-hidden="true">
            <FrostedGlass
              width="100%"
              height="100%"
              tint="var(--fill-secondary)"
              radius={9999}
              interactive={false}
            />
          </span>
        )}
        {button}
      </span>
    );
  }

  return button;
}
