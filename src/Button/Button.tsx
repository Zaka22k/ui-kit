"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LiquidGlass } from "../LiquidGlass";
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
  | { children?: ReactNode; icon?: never }
  | { children?: never; icon: ReactNode; "aria-label": string };

export type ButtonProps = NativeButtonProps &
  ButtonContentProps & {
    appearance?: ButtonAppearance;
    width?: number | string;
    height?: number | string;
  };

const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

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
    width = "auto",
    height = 36,
    ...props
  },
  ref,
) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || (type === "submit" && pending);
  const isIconOnly = icon != null;

  return (
    <LiquidGlass
      interactive={!isDisabled}
      className={cx(styles.panel, buttonStyles[appearance], className)}
      style={{ ...TINT, ...style }}
      width={isIconOnly ? height : width}
      height={height}
    >
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cx(
          styles.root,
          buttonStyles[appearance],
          isIconOnly && styles.iconOnly,
        )}
      >
        {isIconOnly ? <span className={styles.icon}>{icon}</span> : children}
      </button>
    </LiquidGlass>
  );
});

export default Button;
