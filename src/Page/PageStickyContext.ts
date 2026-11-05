"use client";

import { createContext, useContext, useEffect, useId } from "react";

/**
 * Связь Page → DataGrid. Хедер страницы рисует общую подложку (фон и блюр) и для
 * прилипшей под ним шапки таблицы: так на стыке двух заголовков нет шва.
 */
export interface PageStickyContextValue {
  /**
   * Шапка таблицы `key` прилипла под хедером страницы: подложка хедера растягивается
   * вниз на `height` px. `height = 0`: шапка не прилипла (подложка возвращается).
   * Возвращает функцию сброса для этого `key`.
   */
  setStuckExtra: (key: string, height: number) => () => void;
}

export const PageStickyContext = createContext<PageStickyContextValue | null>(
  null,
);

/**
 * Хук для прилипающих элементов (например, шапки DataGrid):
 * сам регистрирует высоту и гарантированно сбрасывает её при размонтировании.
 */
export function usePageStickyExtra(height: number): void {
  const ctx = useContext(PageStickyContext);
  const key = useId();

  useEffect(() => {
    if (!ctx) return undefined;
    return ctx.setStuckExtra(key, height);
  }, [ctx, key, height]);
}
