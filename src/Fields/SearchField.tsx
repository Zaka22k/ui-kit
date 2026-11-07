"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  CSSProperties,
  InputHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { FrostedGlass } from "../FrostedGlass";
import { cx } from "../utils/cx";
import { useForwardedRef } from "../utils/useForwardedRef";
import styles from "./Fields.module.css";

export type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size" | "type"
> & {
  /** Height of the field in pixels. / Высота строки в пикселях. */
  size?: number;
  /** Width of the field. / Ширина строки. */
  width?: number | string;
  /** Called after the clear button is pressed. / Вызывается после нажатия на кнопку очистки. */
  onClear?: () => void;
  /** Accessible name and tooltip of the clear button. / Доступное имя и всплывающая подсказка кнопки очистки. */
  clearLabel?: string;
  /** Class of the glass panel. / Класс стеклянной панели. */
  className?: string;
  /** Style of the glass panel. / Стиль стеклянной панели. */
  style?: CSSProperties;
};

/* ───────────── Утилиты ───────────── */

/*
 * The glass tint is drawn by the panel itself and read from --search-tint, which the CSS module
 * changes on hover, focus and disabled.
 * Заливку стекла рисует сама панель, цвет берётся из --search-tint, который CSS-модуль меняет
 * при наведении, фокусе и disabled.
 */
const SEARCH_TINT: CSSProperties = { backgroundColor: "var(--search-tint)" };

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="8.75"
        cy="8.75"
        r="5.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M12.75 12.75 16.5 16.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4.5 4.5l7 7M11.5 4.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField(
    {
      className,
      style,
      size = 36,
      width = 280,
      value,
      defaultValue,
      onChange,
      onClear,
      onKeyDown,
      clearLabel = "Очистить поиск",
      placeholder = "Поиск…",
      disabled,
      "aria-label": ariaLabel,
      ...props
    },
    forwardedRef,
  ) {
    const { ref: innerRef, setRefs } = useForwardedRef(forwardedRef);

    const isControlled = value !== undefined;
    const [uncontrolledHasValue, setUncontrolledHasValue] = useState(() =>
      Boolean(defaultValue && String(defaultValue).length > 0),
    );

    const prevDefaultValueRef = useRef(defaultValue);
    if (prevDefaultValueRef.current !== defaultValue) {
      prevDefaultValueRef.current = defaultValue;
      if (!isControlled) {
        setUncontrolledHasValue(
          Boolean(defaultValue && String(defaultValue).length > 0),
        );
      }
    }

    useEffect(() => {
      const input = innerRef.current;
      const formEl = input?.form;
      if (!formEl) return;

      const handleReset = () => {
        if (!isControlled) {
          setUncontrolledHasValue(
            Boolean(defaultValue && String(defaultValue).length > 0),
          );
        }
      };

      formEl.addEventListener("reset", handleReset);
      return () => formEl.removeEventListener("reset", handleReset);
    }, [isControlled, defaultValue]);

    const hasValue = isControlled
      ? String(value).length > 0
      : uncontrolledHasValue;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setUncontrolledHasValue(e.target.value.length > 0);
      onChange?.(e);
    };

    const clearInput = () => {
      const input = innerRef.current;
      if (!input || disabled) return;

      const setNativeValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setNativeValue?.call(input, "");
      input.dispatchEvent(new Event("input", { bubbles: true }));

      onClear?.();
      input.focus();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || e.key !== "Escape") return;
      if (!innerRef.current?.value) return;
      e.preventDefault();
      clearInput();
    };

    const keepInputFocus = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
    };

    return (
      <FrostedGlass
        interactive={!disabled}
        className={cx(styles.searchPanel, className)}
        style={{ ...SEARCH_TINT, ...style }}
        width={width}
        height={size}
      >
        <label className={styles.searchInner}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            {...props}
            ref={setRefs}
            type="search"
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel ?? placeholder}
            className={styles.searchInput}
          />
          {hasValue && !disabled && (
            <button
              type="button"
              aria-label={clearLabel}
              title={clearLabel}
              onMouseDown={keepInputFocus}
              onClick={clearInput}
              className={styles.clearButton}
            >
              <ClearIcon />
            </button>
          )}
        </label>
      </FrostedGlass>
    );
  },
);
