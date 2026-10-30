"use client";

import { createContext } from "react";

/**
 * Связь Page → DataGrid. Хедер страницы рисует общую подложку (фон и блюр) и для
 * прилипшей под ним шапки таблицы: так на стыке двух заголовков нет шва.
 */
export interface PageStickyContextValue {
  /**
   * Шапка таблицы `key` прилипла под хедером страницы: подложка хедера растягивается
   * вниз на `height` px. `height = 0`: шапка не прилипла (подложка возвращается).
   */
  setStuckExtra: (key: string, height: number) => void;
}

export const PageStickyContext = createContext<PageStickyContextValue | null>(
  null,
);
