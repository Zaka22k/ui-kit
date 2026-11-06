import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` on the server (no warning during SSR).
 * `useLayoutEffect` в браузере и `useEffect` на сервере (без предупреждения при SSR).
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
