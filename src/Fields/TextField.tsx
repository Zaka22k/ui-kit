"use client";

import { forwardRef, useId } from "react";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
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

const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

const hasContent = (node: ReactNode): boolean =>
  node !== undefined && node !== null && node !== false && node !== "";

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
    ref,
  ) {
    const { pending } = useFormStatus();
    const isDisabled = disabled || pending;

    const baseId = useId();
    const inputId = id ?? `${baseId}-input`;
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

    return (
      <div
        className={cx(
          styles.root,
          labelPlacement === "start" && styles.labelStart,
          isDisabled && styles.disabled,
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
          <label className={styles.control}>
            {startIcon && <span className={styles.icon}>{startIcon}</span>}
            <input
              {...props}
              ref={ref}
              id={inputId}
              type={type}
              disabled={isDisabled}
              aria-describedby={describedBy}
              aria-invalid={isInvalid || undefined}
              className={cx(styles.input, "BodyTextBlockStyle")}
            />
            {endIcon && <span className={styles.icon}>{endIcon}</span>}
          </label>

          {hasFeedback && (
            <div
              id={hintId}
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
