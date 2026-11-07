"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";
import Button from "../Button";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import type { ContextMenuItem } from "../ContextMenu/ContextMenu";
import ProgressRing from "../ProgressRing/ProgressRing";
import { cx } from "../utils/cx";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";
import styles from "./List.module.css";

/**
 * Unique id of an item. Selection and the keyboard cursor are tied to it.
 * Уникальный id элемента. К нему привязаны выбор и курсор клавиатуры.
 */
export type ListItemId = string | number;

/**
 * How the items are laid out.
 * Как расположены элементы.
 *
 * - `vertical`: one column of rows. / один столбец строк.
 * - `grid`: cards wrap into several columns. / карточки переносятся на несколько столбцов.
 * - `horizontal`: one row of cards with horizontal scrolling. / одна строка карточек с горизонтальной прокруткой.
 */
export type ListLayout = "vertical" | "grid" | "horizontal";

/**
 * What `renderItem` gets to know about the item it draws.
 * Что `renderItem` знает об элементе, который рисует.
 */
export interface ListItemState {
  /** Position in `items`. / Позиция в `items`. */
  index: number;
  /** The item is selected. / Элемент выбран. */
  selected: boolean;
  /** The keyboard cursor is on the item and the list has focus. / Курсор клавиатуры на элементе, список в фокусе. */
  active: boolean;
  /** Current layout. / Текущий формат. */
  layout: ListLayout;
}

/**
 * What an item menu works on.
 * С чем работает меню элемента.
 */
export interface ListItemMenuTarget<T> {
  /** The item the menu was opened on. / Элемент, на котором открыли меню. */
  item: T;
  /** Its position in `items`. / Его позиция в `items`. */
  index: number;
}

export interface ListProps<T> {
  /** Items loaded so far. / Загруженные на данный момент элементы. */
  items: readonly T[];
  /**
   * Stable unique id of an item. It is read when `items` changes, not on every render.
   * Стабильный уникальный id элемента. Читается при смене `items`, а не при каждом рендере.
   */
  getItemId: (item: T) => ListItemId;
  /**
   * Draws the content of one item (your own card). It is called only for items that are on
   * the screen or close to it.
   * Рисует содержимое одного элемента (вашу карточку). Вызывается только для элементов на экране
   * и рядом с ним.
   */
  renderItem: (item: T, state: ListItemState) => ReactNode;

  /** Layout of the items. Default `"vertical"`. / Формат элементов. По умолчанию `"vertical"`. */
  layout?: ListLayout;
  /**
   * Width of an item in px. `horizontal`: fixed width. `grid`: the narrowest width, items grow
   * to fill the row. `vertical` ignores it. Default 200.
   * Ширина элемента в px. `horizontal`: фиксированная. `grid`: наименьшая, элементы растягиваются
   * на всю строку. В `vertical` не используется. По умолчанию 200.
   */
  itemWidth?: number;
  /**
   * Height of an item in px. All items have the same height. Default 56 (`vertical`) or 160.
   * Высота элемента в px. У всех элементов она одинаковая. По умолчанию 56 (`vertical`) или 160.
   */
  itemHeight?: number;
  /**
   * `grid` only: width / height of an item. If set, the height follows the width of the item
   * and `itemHeight` is ignored.
   * Только `grid`: ширина / высота элемента. Если задано, высота следует за шириной элемента,
   * а `itemHeight` не используется.
   */
  itemAspectRatio?: number;
  /**
   * `grid` only: fixed number of columns. Without it the number follows the width and `itemWidth`.
   * Только `grid`: фиксированное число столбцов. Без него число зависит от ширины и `itemWidth`.
   */
  columns?: number;
  /** Gap between items in px. Default 4 (`vertical`) or 12. / Промежуток между элементами в px. По умолчанию 4 (`vertical`) или 12. */
  gap?: number;

  /**
   * `vertical` and `grid`. Default `"auto"`: the list scrolls with the page (`Page` / `NavigationView`).
   * Pass a fixed height (e.g. `480` or `"100%"`) to scroll inside the list itself.
   * `vertical` и `grid`. По умолчанию `"auto"`: список прокручивается вместе со страницей (`Page` / `NavigationView`).
   * Передайте фиксированную высоту (например, `480` или `"100%"`), чтобы список прокручивался внутри себя.
   */
  height?: number | string;
  /**
   * `horizontal` only: the list extends to the window edge, so scrolling goes under the floating
   * sidebar of `NavigationView` (`extendContentUnderPane`). Default true. Without
   * `NavigationView` / `Page` it changes nothing.
   * Только `horizontal`: список тянется до края окна, и прокрутка уходит под плавающую панель
   * `NavigationView` (`extendContentUnderPane`). По умолчанию true. Вне `NavigationView` / `Page`
   * ничего не меняет.
   */
  bleed?: boolean;

  /** Let the user select one item. Default false. / Разрешить выбрать один элемент. По умолчанию false. */
  selectable?: boolean;
  /** Selected id (controlled). `null`: nothing is selected. / Выбранный id (управляемый режим). `null`: ничего не выбрано. */
  selectedId?: ListItemId | null;
  /** Selected id at the start (uncontrolled). / Выбранный id в начале (неуправляемый режим). */
  defaultSelectedId?: ListItemId | null;
  /**
   * The selection changed. `item` is `null` when the selection was cleared or the item is not loaded.
   * Выбор изменился. `item` равен `null`, если выбор снят или элемент не загружен.
   */
  onSelectionChange?: (id: ListItemId | null, item: T | null) => void;

  /** An item was clicked. / Кликнули по элементу. */
  onItemClick?: (item: T) => void;
  /** An item was activated: double click or Enter. / Элемент активировали: двойной клик или Enter. */
  onItemActivate?: (item: T) => void;

  /** There is more data on the server. / На сервере есть ещё данные. */
  hasMore?: boolean;
  /** The next portion is being loaded: a ring is shown at the end. / Грузится следующая порция: в конце кольцо. */
  loadingMore?: boolean;
  /** Loading the next portion failed: a message and a retry button are shown. / Подгрузка упала: сообщение и кнопка повтора. */
  loadMoreError?: boolean;
  /**
   * The user got close to the end of the loaded items: load the next portion.
   * Пользователь подошёл к концу загруженных элементов: загрузите следующую порцию.
   */
  onEndReached?: () => void;
  /**
   * How many lines (rows, or columns in `horizontal`) before the end `onEndReached` fires. Default 5.
   * За сколько линий (строк, а в `horizontal` столбцов) до конца вызывается `onEndReached`. По умолчанию 5.
   */
  endReachedThreshold?: number;
  /** Total number of items on the server, only for screen readers. / Всего элементов на сервере, только для скринридеров. */
  totalCount?: number;
  /**
   * Change it when the list is replaced as a whole (search, sorting): the list scrolls to the start
   * and forgets the keyboard cursor.
   * Меняйте, когда список заменён целиком (поиск, сортировка): список прокрутится к началу
   * и забудет курсор клавиатуры.
   */
  resetKey?: string | number;

  /**
   * Items of the context menu of an item. Return nothing to keep the browser's own menu.
   * Пункты контекстного меню элемента. Если ничего не вернуть, останется меню браузера.
   */
  itemMenu?: (
    target: ListItemMenuTarget<T>,
  ) => readonly ContextMenuItem[] | null | undefined;

  /**
   * `"default"`: the list draws the frame of the item (row or card: hover, selection, focus ring).
   * `"none"`: no frame, your card draws everything (use `state.selected` and `state.active`, or
   * the `data-selected` and `data-active` attributes).
   * `"default"`: список рисует рамку элемента (строка или карточка: наведение, выбор, фокус).
   * `"none"`: рамки нет, всё рисует ваша карточка (используйте `state.selected` и `state.active`
   * или атрибуты `data-selected` и `data-active`).
   */
  itemAppearance?: "default" | "none";
  /** Shown when there are no items. / Показывается, когда элементов нет. */
  emptyContent?: ReactNode;
  /** Text next to the loading ring (read by screen readers). Default "Загрузка". / Текст рядом с кольцом загрузки (читают скринридеры). По умолчанию «Загрузка». */
  loadingLabel?: string;
  /** Text of the load error. Default "Не удалось загрузить данные." / Текст ошибки подгрузки. По умолчанию «Не удалось загрузить данные.». */
  loadMoreErrorLabel?: string;
  /** Text of the retry button. Default "Повторить". / Текст кнопки повтора. По умолчанию «Повторить». */
  retryLabel?: string;
  /** Accessible name of the item context menu. Default "Действия с элементом". / Доступное имя контекстного меню элемента. По умолчанию «Действия с элементом». */
  itemMenuLabel?: string;

  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const DEFAULT_ITEM_WIDTH = 200;
const DEFAULT_ITEM_HEIGHT: Record<ListLayout, number> = {
  vertical: 56,
  grid: 160,
  horizontal: 160,
};
const DEFAULT_GAP: Record<ListLayout, number> = {
  vertical: 4,
  grid: 12,
  horizontal: 12,
};
const OVERSCAN: Record<ListLayout, number> = {
  vertical: 6,
  grid: 2,
  horizontal: 3,
};
const DEFAULT_END_THRESHOLD = 5;
const FOOTER_WIDTH = 160;

interface Geometry {
  horizontal: boolean;
  /** Items in one line. / Элементов в одной линии. */
  cols: number;
  /** Width of an item in `horizontal`. / Ширина элемента в `horizontal`. */
  itemW: number;
  itemH: number;
  gap: number;
  /** Step along the scrolling axis. / Шаг вдоль оси прокрутки. */
  lineSize: number;
}

interface Metrics {
  /** Width of the body (vertical and grid). / Ширина тела (vertical и grid). */
  width: number;
  /** Size of the visible area along the scrolling axis. / Размер видимой области вдоль оси прокрутки. */
  view: number;
}

interface MenuState {
  x: number;
  y: number;
  items: readonly ContextMenuItem[];
  id: ListItemId;
  viaKeyboard: boolean;
}

/**
 * Finds the nearest vertically scrollable ancestor (e.g. `.scroller` in `NavigationView`,
 * `.body` in `Modal`, or `window`).
 * Находит ближайшего вертикально прокручиваемого предка (например, `.scroller` в `NavigationView`,
 * `.body` в `Modal` или `window`).
 */
function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
  let el = node?.parentElement ?? null;
  while (el && el !== document.body && el !== document.documentElement) {
    const { overflowY } = getComputedStyle(el);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return window;
}

export function List<T>({
  items,
  getItemId,
  renderItem,
  layout = "vertical",
  itemWidth,
  itemHeight,
  itemAspectRatio,
  columns,
  gap: gapProp,
  height = "auto",
  bleed = true,
  selectable = false,
  selectedId,
  defaultSelectedId,
  onSelectionChange,
  onItemClick,
  onItemActivate,
  hasMore = false,
  loadingMore = false,
  loadMoreError = false,
  onEndReached,
  endReachedThreshold = DEFAULT_END_THRESHOLD,
  totalCount,
  resetKey,
  itemMenu,
  itemAppearance = "default",
  emptyContent = "Нет данных",
  loadingLabel = "Загрузка",
  loadMoreErrorLabel = "Не удалось загрузить данные.",
  retryLabel = "Повторить",
  itemMenuLabel = "Действия с элементом",
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: ListProps<T>) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  /** The element with `role="listbox"`: it holds focus and the keyboard. / Элемент с `role="listbox"`: в нём фокус и клавиатура. */
  const listRef = useRef<HTMLDivElement | null>(null);
  /** The scrollable ancestor found once, not on every scroll event. / Прокручиваемый предок, найденный один раз, а не на каждое событие scroll. */
  const scrollParentRef = useRef<HTMLElement | Window | null>(null);

  const horizontal = layout === "horizontal";
  const isGrid = layout === "grid";
  /** The list has no scroller of its own and moves with the page. / У списка нет своей прокрутки, он движется со страницей. */
  const usesPageScroll =
    !horizontal && (height === undefined || height === "auto");

  const getItemIdRef = useRef(getItemId);
  const onEndReachedRef = useRef(onEndReached);
  useIsomorphicLayoutEffect(() => {
    getItemIdRef.current = getItemId;
    onEndReachedRef.current = onEndReached;
  });

  // ───── Items and ids / Элементы и id ─────
  const count = items.length;
  const ids = useMemo(
    () => items.map((item) => getItemIdRef.current(item)),
    [items],
  );
  const indexById = useMemo(() => {
    const map = new Map<ListItemId, number>();
    ids.forEach((id, index) => map.set(id, index));
    return map;
  }, [ids]);

  const warnedRef = useRef({ label: false, ids: false });
  useEffect(() => {
    if (ariaLabel || ariaLabelledBy || warnedRef.current.label) return;
    warnedRef.current.label = true;
    console.warn(
      "List: передайте aria-label или aria-labelledby, иначе у списка нет доступного имени",
    );
  }, [ariaLabel, ariaLabelledBy]);
  useEffect(() => {
    if (indexById.size === ids.length || warnedRef.current.ids) return;
    warnedRef.current.ids = true;
    console.warn(
      "List: getItemId вернул повторяющиеся id, выбор, курсор и ключи элементов будут работать неверно",
    );
  }, [indexById, ids]);

  // ───── Geometry / Геометрия ─────
  const [metrics, setMetrics] = useState<Metrics>({ width: 0, view: 0 });
  const [topLine, setTopLine] = useState(0);
  const offsetRef = useRef(0);

  const gap = Math.max(0, gapProp ?? DEFAULT_GAP[layout]);
  const baseW = Math.max(1, itemWidth ?? DEFAULT_ITEM_WIDTH);
  const measuredW = metrics.width > 0 ? metrics.width : baseW;
  const cols = isGrid
    ? columns !== undefined && columns > 0
      ? Math.floor(columns)
      : Math.max(1, Math.floor((measuredW + gap) / (baseW + gap)))
    : 1;
  const cardW = isGrid ? (measuredW - gap * (cols - 1)) / cols : measuredW;
  const itemH =
    isGrid && itemAspectRatio !== undefined && itemAspectRatio > 0
      ? Math.max(1, Math.round(cardW / itemAspectRatio))
      : Math.max(1, itemHeight ?? DEFAULT_ITEM_HEIGHT[layout]);
  const lineSize = (horizontal ? baseW : itemH) + gap;

  const geomRef = useRef<Geometry>({
    horizontal,
    cols,
    itemW: baseW,
    itemH,
    gap,
    lineSize,
  });
  geomRef.current = { horizontal, cols, itemW: baseW, itemH, gap, lineSize };

  const lineCount = Math.ceil(count / cols);
  const mainLength = lineCount > 0 ? lineCount * lineSize - gap : 0;

  const updateMetrics = useCallback(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    const g = geomRef.current;

    let width: number;
    let view: number;
    let offset: number;

    if (g.horizontal) {
      const el = scrollerRef.current;
      if (!el) return;
      const padLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      width = el.clientWidth;
      view = el.clientWidth;
      offset = el.scrollLeft - padLeft;
    } else if (!usesPageScroll) {
      const el = scrollerRef.current;
      if (!el) return;
      width = body.clientWidth;
      view = el.clientHeight;
      offset = el.scrollTop;
    } else {
      const scrollParent = scrollParentRef.current ?? getScrollParent(root);
      width = body.clientWidth;
      const bodyRect = body.getBoundingClientRect();
      if (scrollParent instanceof HTMLElement) {
        view = scrollParent.clientHeight;
        offset = scrollParent.getBoundingClientRect().top - bodyRect.top;
      } else {
        // clientHeight does not include the horizontal scrollbar
        // clientHeight не включает горизонтальную полосу прокрутки
        view = document.documentElement.clientHeight;
        offset = -bodyRect.top;
      }
    }

    offsetRef.current = Math.max(0, offset);
    const nextTop = Math.max(0, Math.floor(offset / g.lineSize));
    setTopLine((prev) => (prev === nextTop ? prev : nextTop));
    setMetrics((prev) =>
      prev.width === width && prev.view === view ? prev : { width, view },
    );
  }, [usesPageScroll]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let scrollTarget: HTMLElement | Window | null = null;
    let ro: ResizeObserver | null = null;
    const onScroll = () => updateMetrics();
    // The scrollable ancestor is looked up here and on resize, not on every scroll.
    // Прокручиваемого предка ищем здесь и при ресайзе, а не на каждый scroll.
    const bind = () => {
      const next = usesPageScroll ? getScrollParent(root) : scrollerRef.current;
      if (next === scrollTarget) return;
      scrollTarget?.removeEventListener("scroll", onScroll);
      scrollTarget = next;
      scrollParentRef.current = usesPageScroll ? next : null;
      scrollTarget?.addEventListener("scroll", onScroll, { passive: true });
      if (next instanceof HTMLElement) ro?.observe(next);
    };
    const onChange = () => {
      bind();
      updateMetrics();
    };

    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(onChange);
      ro.observe(root);
    }
    bind();
    updateMetrics();
    window.addEventListener("resize", onChange);

    return () => {
      scrollTarget?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onChange);
      ro?.disconnect();
      scrollParentRef.current = null;
    };
  }, [usesPageScroll, horizontal, updateMetrics]);

  // The line size changed (width, layout, props): the first visible line must be recounted.
  // Размер линии изменился (ширина, формат, свойства): первую видимую линию надо пересчитать.
  useIsomorphicLayoutEffect(() => {
    updateMetrics();
  }, [lineSize, updateMetrics]);

  const visibleLines = Math.ceil(metrics.view / lineSize) + 1;
  const firstLine = Math.min(topLine, Math.max(0, lineCount - 1));
  const overscan = OVERSCAN[layout];
  const start = Math.max(0, firstLine - overscan);
  const end = Math.min(lineCount, firstLine + visibleLines + overscan);

  // ───── Selection / Выбор ─────
  const [innerSelectedId, setInnerSelectedId] = useState<ListItemId | null>(
    defaultSelectedId ?? null,
  );
  const controlled = selectedId !== undefined;
  const selId = controlled ? selectedId : innerSelectedId;

  const commitSelection = (id: ListItemId | null) => {
    if (!controlled) setInnerSelectedId(id);
    const index = id === null ? undefined : indexById.get(id);
    onSelectionChange?.(id, index === undefined ? null : items[index]);
  };

  const selectIndex = (index: number, toggle: boolean) => {
    if (!selectable) return;
    const id = ids[index];
    if (selId === id) {
      if (toggle) commitSelection(null);
      return;
    }
    commitSelection(id);
  };

  // ───── Cursor, menu, focus / Курсор, меню, фокус ─────
  const [activeId, setActiveId] = useState<ListItemId | null>(null);
  const activeIndex = activeId === null ? -1 : (indexById.get(activeId) ?? -1);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [focused, setFocused] = useState(false);
  const requestedRef = useRef(-1);

  const resetToken = `${String(resetKey ?? "")}|${layout}|${usesPageScroll}`;
  const [prevToken, setPrevToken] = useState(resetToken);
  if (prevToken !== resetToken) {
    setPrevToken(resetToken);
    setActiveId(null);
    setMenu(null);
  }

  // Compare with the token that was already applied: StrictMode runs effects twice on mount.
  // Сравниваем с уже применённым токеном: StrictMode дважды запускает эффекты при монтировании.
  const appliedTokenRef = useRef(resetToken);
  useIsomorphicLayoutEffect(() => {
    if (appliedTokenRef.current === resetToken) return;
    appliedTokenRef.current = resetToken;
    const root = rootRef.current;
    if (usesPageScroll) {
      if (root && offsetRef.current > 0) {
        const scrollParent = scrollParentRef.current ?? getScrollParent(root);
        if (scrollParent instanceof HTMLElement) {
          scrollParent.scrollTop = Math.max(
            0,
            scrollParent.scrollTop - offsetRef.current,
          );
        } else {
          window.scrollBy(0, -offsetRef.current);
        }
      }
    } else {
      const el = scrollerRef.current;
      if (el) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    }
    offsetRef.current = 0;
    setTopLine(0);
    requestedRef.current = -1;
    updateMetrics();
  }, [resetToken, usesPageScroll, updateMetrics]);

  const menuId = menu?.id;
  const focusList = () => {
    listRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (menuId === undefined || indexById.has(menuId)) return;
    setMenu(null);
    focusList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, indexById]);

  // ───── Infinite scroll / Бесконечная прокрутка ─────
  // The data ended: the next `hasMore` starts a fresh request even for the same `count`.
  // Данные кончились: следующий `hasMore` снова может запросить порцию при том же `count`.
  useEffect(() => {
    if (!hasMore) requestedRef.current = -1;
  }, [hasMore]);

  const measured = metrics.view > 0;
  useEffect(() => {
    if (!hasMore || loadingMore || loadMoreError || !measured) return;
    if (!onEndReachedRef.current) return;
    if (lineCount - end > endReachedThreshold) return;
    if (requestedRef.current === count) return;
    requestedRef.current = count;
    onEndReachedRef.current();
  }, [
    hasMore,
    loadingMore,
    loadMoreError,
    measured,
    count,
    lineCount,
    end,
    endReachedThreshold,
  ]);

  const retryLoadMore = () => {
    requestedRef.current = count;
    onEndReachedRef.current?.();
  };

  const showFooter = loadingMore || loadMoreError;
  const showEmpty = count === 0 && !hasMore && !loadingMore && !loadMoreError;

  // Keep the loading ring in view when the list is scrolled to its end.
  // Держим кольцо загрузки в поле зрения, если список прокручен до конца.
  useIsomorphicLayoutEffect(() => {
    if (!showFooter) return;
    const root = rootRef.current;
    if (horizontal) {
      const el = scrollerRef.current;
      if (el && el.scrollWidth - (el.scrollLeft + el.clientWidth) <= lineSize + FOOTER_WIDTH) {
        el.scrollLeft = el.scrollWidth;
      }
      return;
    }
    const el =
      usesPageScroll && root
        ? (scrollParentRef.current ?? getScrollParent(root))
        : scrollerRef.current;
    if (el instanceof HTMLElement) {
      if (el.scrollHeight - (el.scrollTop + el.clientHeight) <= lineSize + 2) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [showFooter, horizontal, usesPageScroll]);

  // ───── Scrolling to an item / Прокрутка к элементу ─────
  const ensureVisible = (index: number) => {
    const g = geomRef.current;
    const line = Math.floor(index / g.cols);

    if (g.horizontal) {
      const el = scrollerRef.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const left = padLeft + line * g.lineSize;
      const right = left + g.itemW;
      if (left - padLeft < el.scrollLeft) el.scrollLeft = left - padLeft;
      else if (right > el.scrollLeft + el.clientWidth - padRight) {
        el.scrollLeft = right - el.clientWidth + padRight;
      }
      return;
    }

    if (!usesPageScroll) {
      const el = scrollerRef.current;
      if (!el) return;
      const top = line * g.lineSize;
      const bottom = top + g.itemH;
      if (top < el.scrollTop) el.scrollTop = top;
      else if (bottom > el.scrollTop + el.clientHeight) {
        el.scrollTop = bottom - el.clientHeight;
      }
      return;
    }

    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    const scrollParent = scrollParentRef.current ?? getScrollParent(root);
    const scrollerTop =
      scrollParent instanceof HTMLElement
        ? scrollParent.getBoundingClientRect().top
        : 0;
    const viewHeight =
      scrollParent instanceof HTMLElement
        ? scrollParent.clientHeight
        : document.documentElement.clientHeight;
    // The sticky header of `Page` covers the top of the scroller.
    // Закреплённая шапка `Page` закрывает верх прокручиваемой области.
    const topInset =
      parseFloat(getComputedStyle(root).getPropertyValue("--page-header-height")) || 0;
    const itemTop = body.getBoundingClientRect().top - scrollerTop + line * g.lineSize;
    const itemBottom = itemTop + g.itemH;

    if (itemTop < topInset) {
      const delta = itemTop - topInset;
      if (scrollParent instanceof HTMLElement) scrollParent.scrollTop += delta;
      else window.scrollBy(0, delta);
    } else if (itemBottom > viewHeight) {
      const delta = itemBottom - viewHeight;
      if (scrollParent instanceof HTMLElement) scrollParent.scrollTop += delta;
      else window.scrollBy(0, delta);
    }
  };

  // ───── Context menu / Контекстное меню ─────
  const itemDomId = (index: number) => `${listId}-item-${index}`;

  const openItemMenu = (
    index: number,
    x: number,
    y: number,
    viaKeyboard: boolean,
  ): boolean => {
    if (!itemMenu) return false;
    const item = items[index];
    const id = ids[index];
    const menuItems = itemMenu({ item, index });
    if (!menuItems || menuItems.length === 0) return false;
    if (selectable && selId !== id) commitSelection(id);
    setActiveId(id);
    setMenu({ x, y, items: menuItems, id, viaKeyboard });
    return true;
  };

  const keyMenuAtRef = useRef(0);
  const openMenuAtActiveItem = () => {
    if (activeIndex < 0) return;
    keyMenuAtRef.current = Date.now();
    const index = activeIndex;
    ensureVisible(index);
    // The menu closes on any `scroll`, and a scroll made just now (or a moment ago by an arrow
    // key) raises its event at the next frame, before the animation callbacks. So open it there.
    // Меню закрывается при любой прокрутке, а событие `scroll` от только что сделанной прокрутки
    // приходит в следующем кадре, раньше колбэков анимации. Поэтому открываем меню там.
    requestAnimationFrame(() => {
      const el = document.getElementById(itemDomId(index));
      const rect = (el ?? rootRef.current)?.getBoundingClientRect();
      if (!rect) return;
      openItemMenu(
        index,
        rect.left + Math.min(32, rect.width / 2),
        rect.bottom - 4,
        true,
      );
    });
  };

  // ───── Keyboard and focus / Клавиатура и фокус ─────
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (count === 0) return;

    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      openMenuAtActiveItem();
      return;
    }

    const g = geomRef.current;
    const pageLines = Math.max(1, Math.floor(metrics.view / g.lineSize) - 1);
    const last = count - 1;
    const from = Math.max(0, activeIndex);
    const lastLine = Math.floor(last / g.cols);
    let next = activeIndex;

    switch (e.key) {
      case "ArrowDown":
        if (g.horizontal) return;
        if (activeIndex < 0) next = 0;
        else if (Math.floor(activeIndex / g.cols) < lastLine) {
          next = Math.min(last, activeIndex + g.cols);
        }
        break;
      case "ArrowUp":
        if (g.horizontal) return;
        next = activeIndex < 0 ? 0 : Math.max(0, activeIndex - g.cols);
        break;
      case "ArrowRight":
        if (!g.horizontal && g.cols === 1) return;
        next = activeIndex < 0 ? 0 : Math.min(last, activeIndex + 1);
        break;
      case "ArrowLeft":
        if (!g.horizontal && g.cols === 1) return;
        next = activeIndex < 0 ? 0 : Math.max(0, activeIndex - 1);
        break;
      case "PageDown":
        next = Math.min(last, from + pageLines * g.cols);
        break;
      case "PageUp":
        next = Math.max(0, from - pageLines * g.cols);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case " ":
        if (activeIndex >= 0) selectIndex(activeIndex, e.ctrlKey || e.metaKey);
        e.preventDefault();
        return;
      case "Enter":
        if (activeIndex >= 0) onItemActivate?.(items[activeIndex]);
        e.preventDefault();
        return;
      default:
        return;
    }

    e.preventDefault();
    if (next !== activeIndex) {
      setActiveId(ids[next]);
      ensureVisible(next);
    }
  };

  const handleFocus = (e: FocusEvent<HTMLDivElement>) => {
    setFocused(true);
    if (e.target !== e.currentTarget) return;
    if (activeIndex < 0 && count > 0) {
      const selectedIndex = selId === null ? undefined : indexById.get(selId);
      setActiveId(ids[selectedIndex ?? 0]);
    }
  };

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    setFocused(false);
  };

  // The key of the keyboard also raises `contextmenu` on the focused element.
  // Клавиша «Меню» тоже вызывает `contextmenu` на элементе в фокусе.
  const handleListContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    if (!itemMenu || activeIndex < 0) return;
    e.preventDefault();
    // `Shift+F10` and the "Menu" key raise `keydown` and `contextmenu`: open once
    // `Shift+F10` и клавиша «Меню» дают `keydown` и `contextmenu`: открываем один раз
    if (Date.now() - keyMenuAtRef.current < 500) return;
    openMenuAtActiveItem();
  };

  // ───── Render / Отрисовка ─────
  const setSize = totalCount !== undefined ? totalCount : hasMore ? -1 : count;

  const renderOne = (index: number) => {
    const item = items[index];
    const id = ids[index];
    const isSelected = selectable && selId === id;
    const isActive = index === activeIndex && (focused || menu?.id === id);
    const state: ListItemState = {
      index,
      selected: isSelected,
      active: isActive,
      layout,
    };
    return (
      <div
        key={id}
        id={itemDomId(index)}
        role="option"
        aria-selected={selectable ? isSelected : undefined}
        aria-posinset={index + 1}
        aria-setsize={setSize}
        data-selected={isSelected || undefined}
        data-active={isActive || undefined}
        className={cx(
          styles.item,
          itemAppearance === "default" &&
            (horizontal || isGrid ? styles.itemCard : styles.itemRow),
          isSelected && styles.selected,
          isActive && styles.active,
        )}
        onClick={(e) => {
          setActiveId(id);
          focusList();
          selectIndex(index, e.ctrlKey || e.metaKey);
          onItemClick?.(item);
        }}
        onDoubleClick={() => onItemActivate?.(item)}
        onContextMenu={(e) => {
          if (openItemMenu(index, e.clientX, e.clientY, false)) {
            e.preventDefault();
          }
        }}
      >
        {renderItem(item, state)}
      </div>
    );
  };

  const renderLine = (line: number) => {
    const first = line * cols;
    const last = Math.min(count, first + cols);
    const cells: ReactNode[] = [];
    for (let i = first; i < last; i++) cells.push(renderOne(i));

    if (horizontal) {
      return (
        <div
          key={line}
          role="presentation"
          className={styles.lineH}
          style={{
            width: baseW,
            height: itemH,
            transform: `translateX(${line * lineSize}px)`,
          }}
        >
          {cells}
        </div>
      );
    }
    return (
      <div
        key={line}
        role="presentation"
        className={styles.line}
        style={{
          height: itemH,
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          columnGap: gap,
          transform: `translateY(${line * lineSize}px)`,
        }}
      >
        {cells}
      </div>
    );
  };

  const lines: number[] = [];
  for (let l = start; l < end; l++) lines.push(l);
  if (activeIndex >= 0) {
    const activeLine = Math.floor(activeIndex / cols);
    // keep DOM order = item order for screen readers
    // порядок в DOM = порядок элементов, для скринридеров
    if (activeLine < start) lines.unshift(activeLine);
    else if (activeLine >= end) lines.push(activeLine);
  }

  const footerNode = showFooter && (
    <div
      className={cx(
        horizontal ? styles.footerH : styles.footer,
        "BodyTextBlockStyle",
      )}
      style={
        horizontal
          ? {
              left: mainLength + (lineCount > 0 ? gap : 0),
              width: FOOTER_WIDTH,
              height: itemH,
            }
          : undefined
      }
      role={loadingMore ? "status" : "alert"}
    >
      {loadingMore ? (
        <ProgressRing loading size={20} aria-label={loadingLabel} />
      ) : (
        <>
          <span className={styles.footerError}>
            {loadMoreErrorLabel}
          </span>
          <Button onClick={retryLoadMore}>{retryLabel}</Button>
        </>
      )}
    </div>
  );

  const bodyNode = (
    <div
      ref={bodyRef}
      role="presentation"
      className={styles.body}
      style={
        horizontal
          ? { width: mainLength, height: itemH }
          : { height: mainLength }
      }
    >
      {lines.map(renderLine)}
    </div>
  );

  // Only the items are inside the listbox: the footer and the empty message are next to it.
  // An empty list is a plain group and is not a tab stop.
  // В listbox только элементы: футер и пустое сообщение рядом с ним.
  // Пустой список это обычная группа, и в порядок табуляции он не входит.
  const hasItems = count > 0;
  const listNode = (
    <div
      ref={listRef}
      role={hasItems ? "listbox" : "group"}
      tabIndex={hasItems ? 0 : undefined}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-orientation={
        hasItems ? (horizontal ? "horizontal" : "vertical") : undefined
      }
      aria-busy={loadingMore || undefined}
      aria-activedescendant={
        hasItems && activeIndex >= 0 ? itemDomId(activeIndex) : undefined
      }
      className={cx(styles.listbox, hasItems && styles.focusTarget)}
      style={horizontal ? { width: mainLength } : undefined}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onContextMenu={handleListContextMenu}
    >
      {bodyNode}
    </div>
  );

  const rootStyle = {
    ...(!horizontal && !usesPageScroll ? { height } : {}),
    ...style,
  } as CSSProperties;

  const emptyNode = showEmpty && (
    <div className={cx(styles.empty, "BodyTextBlockStyle")}>{emptyContent}</div>
  );

  let content: ReactNode;
  if (horizontal) {
    content = (
      <>
        <div ref={scrollerRef} className={styles.hScroller}>
          <div
            className={styles.track}
            style={{
              width:
                mainLength +
                (showFooter ? (lineCount > 0 ? gap : 0) + FOOTER_WIDTH : 0),
              height: itemH,
            }}
          >
            {listNode}
            {footerNode}
          </div>
        </div>
        {emptyNode}
      </>
    );
  } else if (usesPageScroll) {
    content = (
      <>
        {listNode}
        {footerNode}
        {emptyNode}
      </>
    );
  } else {
    content = (
      <div ref={scrollerRef} className={styles.scroller}>
        {listNode}
        {footerNode}
        {emptyNode}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={cx(
        styles.root,
        "BodyTextBlockStyle",
        !horizontal && !usesPageScroll && styles.containedScroll,
        horizontal && bleed && styles.bleed,
        className,
      )}
      style={rootStyle}
    >
      {content}

      {menu && (
        <ContextMenu
          items={menu.items}
          x={menu.x}
          y={menu.y}
          activateFirst={menu.viaKeyboard}
          aria-label={itemMenuLabel}
          onClose={(restoreFocus) => {
            setMenu(null);
            if (restoreFocus) focusList();
          }}
        />
      )}
    </div>
  );
}

export default List;
