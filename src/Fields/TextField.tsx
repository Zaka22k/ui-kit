"use client";

import { forwardRef, useId } from "react";
import type {
  CSSProperties,
  InputHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { cx } from "../utils/cx";
import { hasContent } from "../utils/hasContent";
import { useForwardedRef } from "../utils/useForwardedRef";
import styles from "./Fields.module.css";

/* ───────────── Типы ───────────── */

export type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Icon before the text. / Иконка перед текстом. */
  startIcon?: ReactNode;
  /** Icon after the text. / Иконка после текста. */
  endIcon?: ReactNode;
  /** Introductory label. / Вводная подпись. */
  label?: ReactNode;
  /** Where the label sits: above the field or before it. / Где стоит подпись: над полем или перед ним. */
  labelPlacement?: "top" | "start";
  /** Helper text shown below the input field. / Текст подсказки снизу поля ввода. */
  hint?: ReactNode;
  /** Validation error state or message. / Ошибка валидации: подсвечивает рамку красным и выводит текст ошибки вместо `hint`. */
  error?: ReactNode | boolean;
  /** Class of the root element. / Класс корневого элемента. */
  className?: string;
  /** Style of the root element. / Стиль корневого элемента. */
  style?: CSSProperties;
};

export type TextFieldProps = FieldProps;

export const TextField = forwardRef<HTMLInputElement, FieldProps>(
  function TextField(
    {
      startIcon,
      endIcon,
      label,
      labelPlacement = "top",
      hint,
      error,
      className,
      style,
      disabled,
      id,
      type = "text",
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    forwardedRef,
  ) {
    const { pending } = useFormStatus();
    const { ref: inputRef, setRefs } = useForwardedRef(forwardedRef);
    /*
     * While the form is pending the input is read-only, not disabled, so it keeps focus.
     * Пока форма отправляется, поле только для чтения, а не disabled, чтобы не терять фокус.
     */
    const isBusy = pending && !disabled;
    const isDisabled = Boolean(disabled);

    const baseId = useId();
    const inputId = id ?? `${baseId}-input`;
    const hintId = `${baseId}-hint`;
    const hasLabel = hasContent(label);

    const isInvalid =
      Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
    const feedbackMessage =
      typeof error !== "boolean" && hasContent(error) ? error : hint;
    const hasFeedback = hasContent(feedbackMessage);
    const showsErrorText = typeof error !== "boolean" && hasContent(error);

    const describedBy =
      [ariaDescribedBy, hasFeedback ? hintId : undefined]
        .filter(Boolean)
        .join(" ") || undefined;

    /*
     * Clicks on the padding or the icons focus the input; interactive content inside icons keeps its own behavior.
     * Клик по отступам и иконкам фокусирует поле; интерактивное содержимое иконок работает как обычно.
     */
    const focusInput = (e: MouseEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      const target = e.target as HTMLElement;
      if (!input || isDisabled || target === input) return;
      if (target.closest("button, a, input, select, textarea, [role='button']"))
        return;
      e.preventDefault();
      input.focus();
    };

    return (
      <div
        className={cx(
          styles.root,
          labelPlacement === "start" && styles.labelStart,
          (isDisabled || isBusy) && styles.disabled,
          isInvalid && styles.invalid,
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
          <div className={styles.control} onMouseDown={focusInput}>
            {hasContent(startIcon) && (
              <span className={styles.icon}>{startIcon}</span>
            )}
            <input
              {...props}
              ref={setRefs}
              id={inputId}
              type={type}
              disabled={isDisabled}
              readOnly={props.readOnly || isBusy}
              aria-busy={isBusy || undefined}
              aria-describedby={describedBy}
              aria-invalid={isInvalid || undefined}
              className={cx(styles.input, "BodyTextBlockStyle")}
            />
            {hasContent(endIcon) && (
              <span className={styles.icon}>{endIcon}</span>
            )}
          </div>

          {hasFeedback && (
            <div
              id={hintId}
              role={showsErrorText ? "alert" : undefined}
              className={cx(styles.hint, "CaptionTextBlockStyle")}
            >
              {feedbackMessage}
            </div>
          )}
        </div>
      </div>
    );
  },
);
