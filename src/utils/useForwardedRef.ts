import { useCallback, useRef } from "react";
import type { ForwardedRef, RefObject } from "react";

/**
 * Keeps an own ref to the node and forwards the node to the outer ref
 * (a callback or an object). Pass `setRefs` as the `ref` of the element.
 * Хранит собственный ref на узел и передаёт узел во внешний ref
 * (функцию или объект). `setRefs` отдают в `ref` элемента.
 */
export function useForwardedRef<T>(forwardedRef: ForwardedRef<T>): {
  ref: RefObject<T | null>;
  setRefs: (node: T | null) => void;
} {
  const ref = useRef<T | null>(null);
  const setRefs = useCallback(
    (node: T | null) => {
      ref.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );
  return { ref, setRefs };
}
