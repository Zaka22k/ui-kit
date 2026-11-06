"use client";

import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  MouseEvent,
  ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { FrostedGlass } from "../FrostedGlass";
import { cx } from "../utils/cx";
import styles from "./Button.module.css";

export type ButtonAppearance = "normal" | "primary" | "destructive";

const buttonStyles: Record<ButtonAppearance, string> = {
  normal: styles.normal,
  primary: styles.primary,
  destructive: styles.destructive,
};

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
>;

type ButtonContentProps =
  | { children: ReactNode; icon?: never }
  | { children?: never; icon: ReactNode; "aria-label": string };

export type ButtonProps = NativeButtonProps &
  ButtonContentProps & {
    appearance?: ButtonAppearance;
    width?: number | string;
    height?: number | string;
  };

const TINT: CSSProperties = { backgroundColor: "var(--button-tint)" };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    appearance = "normal",
    icon,
    children,
    className,
    style,
    type = "button",
    disabled,
    onClick,
    width = "auto",
    height = 36,
    ...props
  },
  ref,
) {
  const { pending } = useFormStatus();
  // While the form is submitting, the button is not natively disabled:
  // a disabled button drops keyboard focus. It stays focusable, is marked with
  // aria-disabled and aria-busy, and its clicks are ignored.
  // Пока форма отправляется, кнопка не получает нативный disabled: из-за него
  // теряется фокус клавиатуры. Она остаётся фокусируемой, получает aria-disabled
  // и aria-busy, а клики по ней игнорируются.
  const isPending = type === "submit" && pending;
  const isInactive = Boolean(disabled) || isPending;
  const isIconOnly = icon != null && icon !== false;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (isPending) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <FrostedGlass
      interactive={!isInactive}
      className={cx(
        styles.panel,
        buttonStyles[appearance],
        isInactive && styles.inactive,
        className,
      )}
      style={{ ...TINT, ...style }}
      width={isIconOnly ? height : width}
      height={height}
    >
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled}
        aria-disabled={isPending ? true : props["aria-disabled"]}
        aria-busy={isPending ? true : props["aria-busy"]}
        onClick={handleClick}
        className={cx(
          styles.root,
          buttonStyles[appearance],
          isIconOnly && styles.iconOnly,
          isInactive && styles.inactive,
        )}
      >
        {isIconOnly ? <span className={styles.icon}>{icon}</span> : children}
      </button>
    </FrostedGlass>
  );
});

export default Button;
