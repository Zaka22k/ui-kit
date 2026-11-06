"use client";

import { forwardRef, useEffect, useLayoutEffect } from "react";
import type { ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { cx } from "../utils/cx";
import {
  hasLabel,
  useForwardedInputRef,
  useSyncDefaultChecked,
} from "./shared";
import { type ToggleBaseProps } from "./ToggleBaseProps";
import styles from "./Toggles.module.css";

export type CheckboxProps = ToggleBaseProps & {
  indeterminate?: boolean;
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      labelPlacement = "end",
      indeterminate = false,
      className,
      style,
      disabled,
      checked,
      defaultChecked,
      onChange,
      ...rest
    },
    forwardedRef,
  ) {
    const { pending } = useFormStatus();
    const isDisabled = disabled || pending;

    const { inputRef, setRefs } = useForwardedInputRef(forwardedRef);

    useIsomorphicLayoutEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    });

    useSyncDefaultChecked(inputRef, checked, defaultChecked);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);

      e.currentTarget.indeterminate = indeterminate;
    };

    return (
      <label
        className={cx(
          styles.root,
          styles.checkboxRoot,
          labelPlacement === "start" && styles.labelStart,
          isDisabled && styles.disabled,
          className,
        )}
        style={style}
      >
        <span className={styles.control}>
          <input
            {...rest}
            ref={setRefs}
            type="checkbox"
            className={styles.input}
            disabled={isDisabled}
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
          />
          <span className={styles.box} aria-hidden="true">
            <svg
              className={styles.glyph}
              viewBox="0 0 16 16"
              focusable="false"
              aria-hidden="true"
            >
              <path
                className={styles.check}
                d="M3.5 8.5 6.8 11.5 12.5 4.5"
                pathLength={1}
              />
              <path className={styles.dash} d="M4 8h8" pathLength={1} />
            </svg>
          </span>
        </span>
        {hasLabel(label) && <span className={styles.label}>{label}</span>}
      </label>
    );
  },
);
