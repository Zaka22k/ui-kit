import { useEffect } from "react";
import type { ReactNode, RefObject } from "react";

/**
 * Whether the label should be rendered. `undefined`, `null`, `false` and an
 * empty string mean "no label".
 * Нужно ли рисовать подпись. `undefined`, `null`, `false` и пустая строка
 * означают «подписи нет».
 */
export const hasLabel = (label: ReactNode): boolean =>
  label !== undefined && label !== null && label !== false && label !== "";

/**
 * For an uncontrolled input, applies a changed `defaultChecked` to the DOM.
 * React ignores such changes after mount on its own.
 * Для неконтролируемого input переносит изменённый `defaultChecked` в DOM.
 * Сам React после монтирования такие изменения игнорирует.
 */
export function useSyncDefaultChecked(
  inputRef: RefObject<HTMLInputElement | null>,
  checked: boolean | undefined,
  defaultChecked: boolean | undefined,
): void {
  useEffect(() => {
    if (
      checked === undefined &&
      defaultChecked !== undefined &&
      inputRef.current
    ) {
      inputRef.current.checked = defaultChecked;
    }
  }, [inputRef, checked, defaultChecked]);
}
