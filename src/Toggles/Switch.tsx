"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { FrostedGlass } from "../FrostedGlass";
import { type ToggleBaseProps } from "./ToggleBaseProps";
import styles from "./Toggles.module.css";

export type SwitchProps = ToggleBaseProps & {
  size?: "regular" | "mini";
};

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

const hasLabel = (label: ReactNode): boolean =>
  label !== undefined && label !== null && label !== false;

const SWITCH_SIZES = {
  regular: {
    width: 56,
    height: 32,
    thumbWidth: 36,
    thumbHeight: 28,
    inset: 2,
    bezel: 12,
    glassHeight: 20,
    specularWidth: 2,
  },
  mini: {
    width: 45,
    height: 22,
    thumbWidth: 22,
    thumbHeight: 18,
    inset: 2,
    bezel: 8,
    glassHeight: 13,
    specularWidth: 1.5,
  },
} as const;

const THUMB_STYLE: CSSProperties = { backgroundColor: "var(--thumb-fill)" };

const SWITCHING_FALLBACK_MS = 500;

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    label,
    labelPlacement = "end",
    size = "regular",
    className,
    style,
    disabled,
    checked,
    defaultChecked,
    onChange,
    onKeyDown,
    onKeyUp,
    onBlur,
    ...rest
  },
  forwardedRef,
) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  const g = SWITCH_SIZES[size];

  const [pressed, setPressed] = useState(false);
  const [sliding, setSliding] = useState(false);
  const switching = !isDisabled && (pressed || sliding);

  useEffect(() => {
    if (
      checked === undefined &&
      defaultChecked !== undefined &&
      inputRef.current
    ) {
      inputRef.current.checked = defaultChecked;
    }
  }, [checked, defaultChecked]);

  useEffect(() => {
    if (!sliding) return;
    const timer = window.setTimeout(
      () => setSliding(false),
      SWITCHING_FALLBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [sliding]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e);
    if (!prefersReducedMotion()) setSliding(true);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.key === " " && !isDisabled) setPressed(true);
  };

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyUp?.(e);
    if (e.key === " ") setPressed(false);
  };

  const rootStyle = {
    "--switch-width": `${g.width}px`,
    "--switch-height": `${g.height}px`,
    "--switch-thumb-width": `${g.thumbWidth}px`,
    "--switch-inset": `${g.inset}px`,
    ...style,
  } as CSSProperties;

  return (
    <label
      className={cx(
        styles.root,
        styles.switchRoot,
        labelPlacement === "start" && styles.labelStart,
        isDisabled && styles.disabled,
        switching && styles.switching,
        className,
      )}
      style={rootStyle}
      onPointerDown={() => {
        if (!isDisabled) setPressed(true);
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
    >
      <span className={styles.control}>
        <input
          {...rest}
          ref={setRefs}
          type="checkbox"
          role="switch"
          className={styles.input}
          disabled={isDisabled}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onBlur={(e) => {
            onBlur?.(e);
            setPressed(false);
          }}
        />
        <span className={styles.track} aria-hidden="true" />
        <span
          className={styles.thumbSlot}
          aria-hidden="true"
          onTransitionEnd={(e) => {
            if (e.propertyName === "transform") setSliding(false);
          }}
        >
          <FrostedGlass
            className={styles.thumb}
            width={g.thumbWidth}
            height={g.thumbHeight}
            specularWidth={g.specularWidth}
            style={THUMB_STYLE}
          />
        </span>
      </span>
      {hasLabel(label) && <span className={styles.label}>{label}</span>}
    </label>
  );
});
