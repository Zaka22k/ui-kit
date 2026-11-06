import { useCallback, useEffect, useRef } from "react";
import type { ForwardedRef, ReactNode, RefObject } from "react";

/**
 * Whether the label should be rendered. `undefined`, `null`, `false` and an
 * empty string mean "no label".
 * Нужно ли рисовать подпись. `undefined`, `null`, `false` и пустая строка
 * означают «подписи нет».
 */
export const hasLabel = (label: ReactNode): boolean =>
  label !== undefined && label !== null && label !== false && label !== "";

/**
 * Keeps an own ref to the input and forwards the node to the outer ref.
 * Хранит собственный ref на input и передаёт узел во внешний ref.
 */
export function useForwardedInputRef(
  forwardedRef: ForwardedRef<HTMLInputElement>,
): {
  inputRef: RefObject<HTMLInputElement | null>;
  setRefs: (node: HTMLInputElement | null) => void;
} {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );
  return { inputRef, setRefs };
}

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
