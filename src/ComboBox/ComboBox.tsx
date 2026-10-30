"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  ForwardedRef,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  Ref,
} from "react";
import { useFormStatus } from "react-dom";
import { createPortal } from "react-dom";
import styles from "./ComboBox.module.css";

export type ComboBoxOption = string | object;

export interface ComboBoxOptionState {
  label: string;
  value: string;
  selected: boolean;
  active: boolean;
  index: number;
}

type OptionKey<T> = T extends string ? never : keyof T;

export interface ComboBoxProps<
  T extends ComboBoxOption = ComboBoxOption,
> extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "type"
  | "role"
  | "size"
  | "children"
  | "className"
  | "style"
> {
  options: readonly T[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: T | null) => void;
  valueKey?: OptionKey<T>;
  labelKey?: OptionKey<T>;
  getOptionValue?: (option: T) => string;
  getOptionLabel?: (option: T) => string;
  renderOption?: (option: T, state: ComboBoxOptionState) => ReactNode;
  filter?: boolean | ((option: T, query: string, label: string) => boolean);
  label?: ReactNode;
  labelPlacement?: "top" | "start";
  hint?: ReactNode;
  /** Ошибка валидации: подсвечивает рамку красным и выводит текст ошибки вместо `hint`. */
  error?: ReactNode | boolean;
  toggleLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const LIST_MAX_HEIGHT = 240;
const ITEM_HEIGHT = 32;
const LIST_GAP = 8;
const LIST_CHROME = 8 + LIST_GAP;

interface ListAnchor {
  left: number;
  width: number;
  top: number;
  bottom: number;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | undefined>): string =>
  parts.filter(Boolean).join(" ");

const hasContent = (node: ReactNode): boolean =>
  node !== undefined && node !== null && node !== false && node !== "";

function readKey(option: object, key: PropertyKey): string {
  const v = (option as Record<PropertyKey, unknown>)[key];
  return v === undefined || v === null ? "" : String(v);
}

interface Item<T> {
  option: T;
  value: string;
  label: string;
}

function ComboBoxInner<T extends ComboBoxOption>(
  {
    options,
    value,
    defaultValue,
    onChange,
    valueKey,
    labelKey,
    getOptionValue,
    getOptionLabel,
    renderOption,
    filter = true,
    label,
    labelPlacement = "top",
    hint,
    error,
    toggleLabel = "Показать варианты",
    className,
    style,
    disabled,
    id,
    name,
    form,
    onKeyDown,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    ...rest
  }: ComboBoxProps<T>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const baseId = useId();
  const inputId = id ?? `${baseId}-input`;
  const listId = `${baseId}-list`;
  const hintId = `${baseId}-hint`;
  const hasLabel = hasContent(label);

  const isInvalid =
    Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const feedbackMessage =
    typeof error !== "boolean" && hasContent(error) ? error : hint;
  const hasFeedback = hasContent(feedbackMessage);

  const describedBy =
    [ariaDescribedBy, hasFeedback ? hintId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  const [inner, setInner] = useState(defaultValue ?? "");
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [anchor, setAnchor] = useState<ListAnchor | null>(null);

  const prevDefaultValueRef = useRef(defaultValue);
  if (prevDefaultValueRef.current !== defaultValue) {
    prevDefaultValueRef.current = defaultValue;
    if (value === undefined) {
      setInner(defaultValue ?? "");
      setQuery(null);
    }
  }

  useEffect(() => {
    const input = inputRef.current;
    const formEl = input?.form;
    if (!formEl) return;

    const handleReset = () => {
      if (value === undefined) {
        setInner(defaultValue ?? "");
      }
      setQuery(null);
      setOpen(false);
    };

    formEl.addEventListener("reset", handleReset);
    return () => formEl.removeEventListener("reset", handleReset);
  }, [value, defaultValue]);

  const current = value !== undefined ? value : inner;
  const getValue = useCallback(
    (o: T): string => {
      if (getOptionValue) return getOptionValue(o);
      if (typeof o === "string") return o;
      const key = (valueKey ?? labelKey) as PropertyKey | undefined;
      return key === undefined ? "" : readKey(o as object, key);
    },
    [getOptionValue, valueKey, labelKey],
  );

  const getLabel = useCallback(
    (o: T): string => {
      if (getOptionLabel) return getOptionLabel(o);
      if (typeof o === "string") return o;
      const key = (labelKey ?? valueKey) as PropertyKey | undefined;
      return key === undefined ? "" : readKey(o as object, key);
    },
    [getOptionLabel, valueKey, labelKey],
  );

  const items = useMemo<Item<T>[]>(
    () =>
      options.map((option) => ({
        option,
        value: getValue(option),
        label: getLabel(option),
      })),
    [options, getValue, getLabel],
  );

  const visible = useMemo(() => {
    if (query === null || filter === false) return items;
    if (typeof filter === "function") {
      return items.filter((i) => filter(i.option, query, i.label));
    }
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query, filter]);

  const listVisible = open && !isDisabled && visible.length > 0;
  const currentLabel = items.find((i) => i.value === current)?.label ?? current;
  const displayText = query ?? currentLabel;

  const visibleCount = visible.length;
  useIsomorphicLayoutEffect(() => {
    if (!listVisible) {
      setAnchor(null);
      return;
    }

    const update = () => {
      const field = fieldRef.current;
      if (!field) return;
      const rect = field.getBoundingClientRect();
      const need =
        Math.min(LIST_MAX_HEIGHT, visibleCount * ITEM_HEIGHT) + LIST_CHROME;
      const below = window.innerHeight - rect.bottom;
      setPlacement(below < need && rect.top > below ? "top" : "bottom");
      const next: ListAnchor = {
        left: rect.left,
        width: rect.width,
        top: rect.bottom,
        bottom: window.innerHeight - rect.top,
      };
      setAnchor((prev) =>
        prev &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.top === next.top &&
        prev.bottom === next.bottom
          ? prev
          : next,
      );
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [listVisible, visibleCount]);

  useEffect(() => {
    if (!listVisible || activeIndex < 0) return;
    document
      .getElementById(`${listId}-${activeIndex}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [listVisible, activeIndex, listId]);

  const commit = (next: string, option: T | null) => {
    if (value === undefined) setInner(next);
    onChange?.(next, option);
  };

  const selectItem = (item: Item<T>) => {
    commit(item.value, item.option);
    setQuery(null);
    setOpen(false);
    inputRef.current?.focus();
  };

  const openList = (edge?: "first" | "last") => {
    const selected = items.findIndex((i) => i.value === current);
    setQuery(null);
    setOpen(true);
    setActiveIndex(
      selected >= 0
        ? selected
        : edge === "last"
          ? items.length - 1
          : edge
            ? 0
            : -1,
    );
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const lower = text.toLowerCase();
    const matched = items.find((i) => i.label.toLowerCase() === lower);
    setQuery(text);
    setOpen(true);
    setActiveIndex(-1);
    commit(matched ? matched.value : text, matched ? matched.option : null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || isDisabled) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        const down = e.key === "ArrowDown";
        if (!listVisible) {
          openList(down ? "first" : "last");
          return;
        }
        const n = visible.length;
        setActiveIndex((i) =>
          i < 0 ? (down ? 0 : n - 1) : (i + (down ? 1 : -1) + n) % n,
        );
        return;
      }
      case "Enter": {
        const item = listVisible ? visible[activeIndex] : undefined;
        if (item) {
          e.preventDefault();
          selectItem(item);
        } else {
          setOpen(false);
        }
        return;
      }
      case "Escape":
        if (listVisible) {
          e.preventDefault();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
    }
  };

  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(next)) return;
    if (next && document.getElementById(listId)?.contains(next)) return;
    setOpen(false);
    setQuery(null);
  };

  const toggle = () => {
    inputRef.current?.focus();
    if (listVisible) setOpen(false);
    else openList();
  };

  const listStyle: CSSProperties | undefined = anchor
    ? {
        position: "fixed",
        left: anchor.left,
        width: anchor.width,
        ...(placement === "top"
          ? { bottom: anchor.bottom + LIST_GAP }
          : { top: anchor.top + LIST_GAP }),
      }
    : undefined;
  return (
    <div
      className={cx(
        styles.root,
        labelPlacement === "start" && styles.labelStart,
        isDisabled && styles.disabled,
        isInvalid && styles.invalid,
        listVisible && styles.open,
        className,
      )}
      style={style}
    >
      {hasLabel && (
        <label
          className={cx(styles.label, "BodyTextBlockStyle")}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}

      <div className={styles.fieldWrapper}>
        <div ref={fieldRef} className={styles.field} onBlur={handleFieldBlur}>
          <div className={styles.control}>
            {name && !isDisabled && (
              <input type="hidden" name={name} form={form} value={current} />
            )}
            <input
              autoComplete="off"
              {...rest}
              ref={setRefs}
              id={inputId}
              form={form}
              className={cx(styles.input, "BodyTextBlockStyle")}
              type="text"
              role="combobox"
              disabled={isDisabled}
              value={displayText}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              aria-expanded={listVisible}
              aria-controls={listVisible ? listId : undefined}
              aria-autocomplete={filter === false ? "none" : "list"}
              aria-describedby={describedBy}
              aria-invalid={isInvalid || undefined}
              aria-activedescendant={
                listVisible && activeIndex >= 0
                  ? `${listId}-${activeIndex}`
                  : undefined
              }
            />
            <button
              type="button"
              tabIndex={-1}
              className={styles.button}
              aria-label={toggleLabel}
              disabled={isDisabled}
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggle}
            >
              <svg
                className={styles.chevron}
                viewBox="0 0 16 16"
                width="12"
                height="12"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M3.5 6 8 10.5 12.5 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {listVisible &&
            anchor &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                className={cx(
                  styles.list,
                  placement === "top" && styles.listTop,
                )}
                style={listStyle}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div
                  id={listId}
                  role="listbox"
                  className={styles.listbox}
                  style={{ maxHeight: LIST_MAX_HEIGHT }}
                >
                  {visible.map((item, index) => {
                    const selected = item.value === current;
                    const active = index === activeIndex;
                    return (
                      <div
                        key={`${item.value}\u0000${index}`}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={selected}
                        className={cx(
                          styles.option,
                          "BodyTextBlockStyle",
                          active && styles.optionActive,
                        )}
                        onClick={() => selectItem(item)}
                        onMouseMove={() => {
                          if (!active) setActiveIndex(index);
                        }}
                      >
                        <div className={styles.optionContent}>
                          {renderOption
                            ? renderOption(item.option, {
                                label: item.label,
                                value: item.value,
                                selected,
                                active,
                                index,
                              })
                            : item.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>,
              document.body,
            )}
        </div>

        {hasFeedback && (
          <div id={hintId} className={cx(styles.hint, "CaptionTextBlockStyle")}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export const ComboBox = forwardRef(ComboBoxInner) as <
  T extends ComboBoxOption = string,
>(
  props: ComboBoxProps<T> & { ref?: Ref<HTMLInputElement> },
) => ReactElement;
