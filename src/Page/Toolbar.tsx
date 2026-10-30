"use client";

import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from "react";
import { LiquidGlass } from "../LiquidGlass";
import styles from "./Toolbar.module.css";

const GROUP_TINT: CSSProperties = { backgroundColor: "var(--toolbar-tint)" };

export const TOOLBAR_GROUP_HEIGHT = 36;

export interface ToolbarProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> {
  leading?: ReactNode;

  title?: ReactNode;

  center?: ReactNode;

  trailing?: ReactNode;
}

export const Toolbar = ({
  leading,
  title,
  center,
  trailing,
  className,
  ...rest
}: ToolbarProps) => (
  <header
    role="toolbar"
    className={[styles.toolbar, className].filter(Boolean).join(" ")}
    {...rest}
  >
    {(leading || title) && (
      <div className={styles.leading}>
        {leading}
        {title && <div className={styles.title}>{title}</div>}
      </div>
    )}
    {center && <div className={styles.center}>{center}</div>}
    {trailing && <div className={styles.trailing}>{trailing}</div>}
  </header>
);

export interface ToolbarGroupProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  children?: ReactNode;

  height?: number;

  width?: number | string;
}

export const ToolbarGroup = ({
  children,
  height = TOOLBAR_GROUP_HEIGHT,
  width = "auto",
  className,
  style,
  ...rest
}: ToolbarGroupProps) => (
  <LiquidGlass
    role="group"
    interactive
    width={width}
    height={height}
    style={{ ...GROUP_TINT, ...style }}
    className={[styles.group, className].filter(Boolean).join(" ")}
    {...rest}
  >
    {children}
  </LiquidGlass>
);

export interface ToolbarSpacerProps {
  flexible?: boolean;
}

export const ToolbarSpacer = ({ flexible = false }: ToolbarSpacerProps) => (
  <span
    aria-hidden="true"
    className={flexible ? styles.flexibleSpacer : styles.fixedSpacer}
  />
);

export interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(
    { icon, children, className, type = "button", ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={[styles.button, className].filter(Boolean).join(" ")}
        {...rest}
      >
        {icon}
        {children}
      </button>
    );
  },
);

export const ToolbarDivider = () => (
  <span
    role="separator"
    aria-orientation="vertical"
    className={styles.divider}
  />
);

export default Toolbar;
