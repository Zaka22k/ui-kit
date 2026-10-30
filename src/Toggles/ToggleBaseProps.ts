import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export type ToggleBaseProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "role" | "size" | "children" | "className" | "style"
> & {
  /**
   * Text next to the control. Without it, pass `aria-label`.
   * Подпись рядом с элементом. Если её нет, передайте `aria-label`.
   */
  label?: ReactNode;
  /**
   * Where the label sits: after the control (default, as in HIG) or before it.
   * Где стоит подпись: после элемента (по умолчанию, как в HIG) или перед ним.
   */
  labelPlacement?: "end" | "start";
  /** Class of the root element. / Класс корневого элемента. */
  className?: string;
  /** Style of the root element. / Стиль корневого элемента. */
  style?: CSSProperties;
};
