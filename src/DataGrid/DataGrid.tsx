"use client";

import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  UIEvent,
} from "react";
import Button from "../Button";
import { ContextMenu } from "../ContextMenu/ContextMenu";
import type { ContextMenuItem } from "../ContextMenu/ContextMenu";
import ProgressRing from "../ProgressRing/ProgressRing";
import { Checkbox } from "../Toggles";
import { PageStickyContext } from "../Page/PageStickyContext";
import styles from "./DataGrid.module.css";

/**
 * Unique id of a row. Selection and animations are tied to it.
 * Уникальный id строки. К нему привязаны выделение и анимации.
 */
export type DataGridRowId = string | number;

export interface DataGridColumn<T> {
  /** Unique within the grid. / Уникален в пределах таблицы. */
  id: string;
  /** Header content. / Содержимое заголовка. */
  header: ReactNode;
  /**
   * Content of the cell. Text is cut off with an ellipsis, it never wraps.
   * Содержимое ячейки. Текст обрезается многоточием и не переносится.
   */
  cell: (row: T, index: number) => ReactNode;
  /** Initial width in px. Default 160. / Начальная ширина в px. По умолчанию 160. */
  width?: number;
  /** Narrowest width in px. Default 80. / Наименьшая ширина в px. По умолчанию 80. */
  minWidth?: number;
  /** Widest width in px. / Наибольшая ширина в px. */
  maxWidth?: number;
  /** Whether the user can resize the column. Default true. / Можно ли менять ширину. По умолчанию true. */
  resizable?: boolean;
  /** Alignment of header and cells. Default `start`. / Выравнивание заголовка и ячеек. По умолчанию `start`. */
  align?: "start" | "center" | "end";
}

/**
 * What a row menu works on.
 * С чем работает меню строки.
 */
export interface DataGridRowMenuTarget<T> {
  /** The row the menu was opened on. / Строка, на которой открыли меню. */
  row: T;
  /**
   * Rows the command applies to: all selected rows when the row is selected, otherwise just `row`.
   * Строки, к которым применяется команда: все выделенные, если строка выделена, иначе только `row`.
   */
  rows: T[];
}

export interface DataGridProps<T> {
  /** Rows loaded so far. / Загруженные на данный момент строки. */
  rows: readonly T[];
  columns: readonly DataGridColumn<T>[];
  /**
   * Stable unique id of a row. It is read when `rows` changes, not on every render.
   * Стабильный уникальный id строки. Читается при смене `rows`, а не при каждом рендере.
   */
  getRowId: (row: T) => DataGridRowId;

  /**
   * Height of the grid. Default `"auto"`: the grid scrolls with the page (`Page` / `NavigationView`),
   * its header sticks below the page header, and rows pass under the headers.
   * Pass a fixed height (e.g. `480` or `"100%"`) to scroll inside the grid itself.
   *
   * Высота таблицы. По умолчанию `"auto"`: таблица прокручивается вместе со страницей,
   * её шапка фиксируется под заголовком страницы, а строки проходят под заголовками.
   * Передайте фиксированную высоту (например, `480` или `"100%"`), чтобы таблица прокручивалась внутри себя.
   */
  height?: number | string;
  /**
   * Sticky top offset of the table header when scrolling with the page. Default `64` (below `Page` header).
   * Отступ сверху для фиксированной шапки таблицы при прокрутке со страницей. По умолчанию `64` (под шапкой `Page`).
   */
  stickyTop?: number | string;
  /** Alternating row fill instead of dividers. / Чередующаяся заливка строк вместо разделителей. */
  striped?: boolean;
  /** Shown when there are no rows. / Показывается, когда строк нет. */
  emptyContent?: ReactNode;

  /** Show a checkbox column. / Показывать колонку с чекбоксами. */
  selectable?: boolean;
  /** Selected ids (controlled). / Выделенные id (управляемый режим). */
  selectedIds?: ReadonlySet<DataGridRowId>;
  /** Selected ids at the start (uncontrolled). / Выделенные id в начале (неуправляемый режим). */
  defaultSelectedIds?: Iterable<DataGridRowId>;
  onSelectionChange?: (ids: ReadonlySet<DataGridRowId>) => void;

  /** A row was clicked. / Кликнули по строке. */
  onRowClick?: (row: T) => void;
  /** A row was activated: double click or Enter. / Строку активировали: двойной клик или Enter. */
  onRowActivate?: (row: T) => void;

  /** There is more data on the server. / На сервере есть ещё данные. */
  hasMore?: boolean;
  /** The next portion is being loaded: a ring is shown at the end. / Грузится следующая порция: в конце кольцо. */
  loadingMore?: boolean;
  /** Loading the next portion failed: a message and a retry button are shown. / Подгрузка упала: сообщение и кнопка повтора. */
  loadMoreError?: boolean;
  /**
   * The user got close to the end of the loaded rows: load the next portion.
   * Пользователь подошёл к концу загруженных строк: загрузите следующую порцию.
   */
  onEndReached?: () => void;
  /** How many rows before the end `onEndReached` fires. Default 10. / За сколько строк до конца вызывается `onEndReached`. По умолчанию 10. */
  endReachedThreshold?: number;
  /** Total number of rows on the server, only for screen readers. / Всего строк на сервере, только для скринридеров. */
  totalCount?: number;
  /**
   * Change it when the list is replaced as a whole (search, sorting): the grid scrolls to the top
   * and does not animate the swap.
   * Меняйте, когда список заменён целиком (поиск, сортировка): таблица прокрутится к началу
   * и не будет анимировать замену.
   */
  resetKey?: string | number;

  /**
   * Items of the context menu of a row. Return nothing to keep the browser's own menu.
   * Пункты контекстного меню строки. Если ничего не вернуть, останется меню браузера.
   */
  rowMenu?: (
    target: DataGridRowMenuTarget<T>,
  ) => readonly ContextMenuItem[] | null | undefined;

  /** Animate rows that appear and disappear. Default true. / Анимировать появление и исчезновение строк. По умолчанию true. */
  animateChanges?: boolean;

  /**
   * In page-scroll mode the grid extends to the window edge, so horizontal scrolling goes
   * under the floating sidebar of `NavigationView` (`extendContentUnderPane`). Default true.
   * Without `NavigationView` / `Page` it changes nothing.
   *
   * В режиме скролла со страницей таблица тянется до края окна, и горизонтальная прокрутка
   * уходит под плавающую панель `NavigationView` (`extendContentUnderPane`). По умолчанию true.
   * Вне `NavigationView` / `Page` ничего не меняет.
   */
  bleed?: boolean;

  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const noop = () => {};

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;
const SELECT_COLUMN_WIDTH = 48;
const DEFAULT_COLUMN_WIDTH = 160;
const DEFAULT_MIN_COLUMN_WIDTH = 80;
const OVERSCAN = 6;
const DEFAULT_END_THRESHOLD = 10;
const MAX_ANIMATED_CHANGES = 20;
const SETTLE_MS = 320;
const HIGHLIGHT_MS = 1600;
const KEY_RESIZE_STEP = 10;
const KEY_RESIZE_STEP_LARGE = 50;

interface Ghost<T> {
  id: DataGridRowId;
  row: T;
  index: number;
}

interface Anim<T> {
  token: number;
  entering: ReadonlySet<DataGridRowId>;
  exiting: readonly Ghost<T>[];
  moving: boolean;
}

interface MenuState {
  x: number;
  y: number;
  items: readonly ContextMenuItem[];
  rowId: DataGridRowId;
  viaKeyboard: boolean;
}

interface ResizeState {
  id: string;
  pointerId: number;
  startX: number;
  startWidth: number;
  min: number;
  max: number;
  width: number;
}

function buildLayout<T>(
  columns: readonly DataGridColumn<T>[],
  widthOf: (column: DataGridColumn<T>) => number,
  selectable: boolean,
): { template: string; total: number } {
  const parts: string[] = [];
  let total = 0;
  if (selectable) {
    parts.push(`${SELECT_COLUMN_WIDTH}px`);
    total += SELECT_COLUMN_WIDTH;
  }
  columns.forEach((column, i) => {
    const w = widthOf(column);
    total += w;
    parts.push(i === columns.length - 1 ? `minmax(${w}px, 1fr)` : `${w}px`);
  });
  return { template: parts.join(" "), total };
}

const justify = (align: DataGridColumn<unknown>["align"]): CSSProperties => ({
  justifyContent:
    align === "end" ? "flex-end" : align === "center" ? "center" : "flex-start",
});

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

export function DataGrid<T>({
  rows,
  columns,
  getRowId,
  height = "auto",
  stickyTop,
  striped = false,
  emptyContent = "Нет данных",
  selectable = false,
  selectedIds,
  defaultSelectedIds,
  onSelectionChange,
  onRowClick,
  onRowActivate,
  hasMore = false,
  loadingMore = false,
  loadMoreError = false,
  onEndReached,
  endReachedThreshold = DEFAULT_END_THRESHOLD,
  totalCount,
  resetKey,
  rowMenu,
  animateChanges = true,
  bleed = true,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: DataGridProps<T>) {
  const gridId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const headerScrollRef = useRef<HTMLDivElement | null>(null);
  const bodyScrollRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const isPageScroll = height === undefined || height === "auto";

  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;
  const onEndReachedRef = useRef(onEndReached);
  onEndReachedRef.current = onEndReached;

  // ───── Rows and ids / Строки и id ─────
  const ids = useMemo(
    () => rows.map((row) => getRowIdRef.current(row)),
    [rows],
  );
  const indexById = useMemo(() => {
    const map = new Map<DataGridRowId, number>();
    ids.forEach((id, index) => map.set(id, index));
    return map;
  }, [ids]);

  // ───── Column widths / Ширина колонок ─────
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [resizingId, setResizingId] = useState<string | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  const limitsOf = (column: DataGridColumn<T>) => ({
    min: column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
    max: column.maxWidth ?? Number.POSITIVE_INFINITY,
  });
  const widthOf = (column: DataGridColumn<T>): number => {
    const { min, max } = limitsOf(column);
    return clamp(
      widths[column.id] ?? column.width ?? DEFAULT_COLUMN_WIDTH,
      min,
      max,
    );
  };
  const layout = buildLayout(columns, widthOf, selectable);

  // ───── Window of rows / Окно строк ─────
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [topIndex, setTopIndex] = useState(0);
  const scrollTopRef = useRef(0);

  // Шапка прилипла под хедером страницы (только в режиме скролла со страницей).
  // Внутри Page подложку тогда рисует хедер страницы, чтобы на стыке не было шва.
  const pageSticky = useContext(PageStickyContext);
  const [headerStuck, setHeaderStuck] = useState(false);

  const updateMetrics = useCallback(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    if (!isPageScroll) {
      const el = scrollerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      scrollTopRef.current = el.scrollTop;
      const nextTop = Math.max(0, Math.floor(el.scrollTop / ROW_HEIGHT));
      setTopIndex((prev) => (prev === nextTop ? prev : nextTop));
      setViewport((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
      return;
    }

    const scrollParent = getScrollParent(root);
    const w = bodyScrollRef.current?.clientWidth ?? root.clientWidth;
    let h: number;
    let scrolledPastBodyTop: number;

    if (scrollParent instanceof HTMLElement) {
      h = scrollParent.clientHeight;
      const scrollerRect = scrollParent.getBoundingClientRect();
      const bodyRect = body.getBoundingClientRect();
      scrolledPastBodyTop = scrollerRect.top - bodyRect.top;
    } else {
      h = window.innerHeight;
      const bodyRect = body.getBoundingClientRect();
      scrolledPastBodyTop = -bodyRect.top;
    }

    scrollTopRef.current = Math.max(0, scrolledPastBodyTop);
    const nextTop = Math.max(0, Math.floor(scrolledPastBodyTop / ROW_HEIGHT));
    setTopIndex((prev) => (prev === nextTop ? prev : nextTop));
    setViewport((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));

    // Прилипла = таблица уже прокручена выше линии прилипания, а шапка стоит ровно на
    // ней (когда низ таблицы уходит вверх, шапку выталкивает выше линии: тогда не прилипла).
    const header = headerScrollRef.current;
    if (header) {
      const containerTop =
        scrollParent instanceof HTMLElement
          ? scrollParent.getBoundingClientRect().top
          : 0;
      const stickyPx = parseFloat(getComputedStyle(header).top) || 0;
      const naturalTop = root.getBoundingClientRect().top - containerTop;
      const headerTop = header.getBoundingClientRect().top - containerTop;
      const stuck = naturalTop < stickyPx - 0.5 && headerTop > stickyPx - 0.5;
      setHeaderStuck((prev) => (prev === stuck ? prev : stuck));
    }
  }, [isPageScroll]);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    updateMetrics();

    const scrollParent = isPageScroll
      ? getScrollParent(root)
      : scrollerRef.current;

    const onScroll = () => updateMetrics();
    scrollParent?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateMetrics);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateMetrics);
      ro.observe(root);
      if (scrollParent instanceof HTMLElement) {
        ro.observe(scrollParent);
      }
    }

    return () => {
      scrollParent?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateMetrics);
      ro?.disconnect();
    };
  }, [isPageScroll, updateMetrics]);

  const handleHorizontalScroll = (e: UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const bodyViewportHeight = isPageScroll
    ? viewport.h
    : Math.max(0, viewport.h - HEADER_HEIGHT);
  const visibleCount = Math.ceil(bodyViewportHeight / ROW_HEIGHT) + 1;
  const firstVisible = Math.min(topIndex, Math.max(0, rows.length - 1));
  const start = Math.max(0, firstVisible - OVERSCAN);
  const end = Math.min(rows.length, firstVisible + visibleCount + OVERSCAN);

  // ───── Selection / Выделение ─────
  const [innerSelected, setInnerSelected] = useState<
    ReadonlySet<DataGridRowId>
  >(() => new Set(defaultSelectedIds));
  const selected = selectedIds ?? innerSelected;
  const anchorRef = useRef<DataGridRowId | null>(null);

  const commitSelection = (next: ReadonlySet<DataGridRowId>) => {
    if (selectedIds === undefined) setInnerSelected(next);
    onSelectionChange?.(next);
  };

  const selectedLoaded = useMemo(() => {
    let count = 0;
    for (const id of ids) if (selected.has(id)) count++;
    return count;
  }, [ids, selected]);
  const allSelected = ids.length > 0 && selectedLoaded === ids.length;
  const someSelected = selectedLoaded > 0 && !allSelected;

  const toggleRow = (index: number, checked: boolean, range: boolean) => {
    const next = new Set(selected);
    let from = index;
    let to = index;
    if (range && anchorRef.current !== null) {
      const anchor = indexById.get(anchorRef.current);
      if (anchor !== undefined) {
        from = Math.min(anchor, index);
        to = Math.max(anchor, index);
      }
    }
    for (let i = from; i <= to; i++) {
      if (checked) next.add(ids[i]);
      else next.delete(ids[i]);
    }
    anchorRef.current = ids[index];
    commitSelection(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    for (const id of ids) {
      if (allSelected) next.delete(id);
      else next.add(id);
    }
    commitSelection(next);
  };

  // ───── Active row, menu, animations / Активная строка, меню, анимации ─────
  const [activeId, setActiveId] = useState<DataGridRowId | null>(null);
  const activeIndex = activeId === null ? -1 : (indexById.get(activeId) ?? -1);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [anim, setAnim] = useState<Anim<T> | null>(null);
  const [prev, setPrev] = useState({ rows, ids, resetKey });
  const pendingShiftRef = useRef(0);

  if (prev.rows !== rows || prev.resetKey !== resetKey) {
    const prevIds = prev.ids;
    setPrev({ rows, ids, resetKey });
    pendingShiftRef.current = 0;

    if (prev.resetKey !== resetKey) {
      setAnim(null);
      setActiveId(null);
      setMenu(null);
    } else {
      const prevIndexById = new Map<DataGridRowId, number>();
      prevIds.forEach((id, index) => prevIndexById.set(id, index));

      const added: DataGridRowId[] = [];
      ids.forEach((id) => {
        if (!prevIndexById.has(id)) added.push(id);
      });
      const removed: Ghost<T>[] = [];
      prevIds.forEach((id, index) => {
        if (!indexById.has(id))
          removed.push({ id, row: prev.rows[index], index });
      });

      if (activeId !== null && !indexById.has(activeId)) {
        const old = prevIndexById.get(activeId) ?? 0;
        setActiveId(ids.length > 0 ? ids[Math.min(old, ids.length - 1)] : null);
      }

      if (added.length > 0 || removed.length > 0) {
        const scrollTop = scrollTopRef.current;
        let shift = 0;
        if (scrollTop > 1 && prevIds.length > 0) {
          const anchorOld = Math.min(
            Math.floor(scrollTop / ROW_HEIGHT),
            prevIds.length - 1,
          );
          const anchorNew = indexById.get(prevIds[anchorOld]);
          if (anchorNew !== undefined) shift = anchorNew - anchorOld;
        }
        pendingShiftRef.current = shift * ROW_HEIGHT;

        const tailAppend =
          removed.length === 0 &&
          added.every((id) => (indexById.get(id) ?? 0) >= prevIds.length);

        if (tailAppend) {
          // keep whatever is playing
        } else if (
          animateChanges &&
          shift === 0 &&
          prevIds.length > 0 &&
          added.length + removed.length <= MAX_ANIMATED_CHANGES
        ) {
          const windowFirst = topIndex - 1;
          const windowLast = topIndex + visibleCount + 1;
          const visibleGhosts = removed.filter(
            (g) => g.index >= windowFirst && g.index <= windowLast,
          );
          setAnim((a) => ({
            token: (a?.token ?? 0) + 1,
            entering: new Set([...(a?.entering ?? []), ...added]),
            exiting: [...(a?.exiting ?? []), ...visibleGhosts],
            moving: true,
          }));
        } else {
          setAnim(null);
        }
      }
    }
  }

  const animToken = anim?.token;
  useEffect(() => {
    if (animToken === undefined) return;
    const settle = window.setTimeout(
      () =>
        setAnim((a) =>
          a && a.token === animToken ? { ...a, exiting: [], moving: false } : a,
        ),
      SETTLE_MS,
    );
    const done = window.setTimeout(
      () => setAnim((a) => (a && a.token === animToken ? null : a)),
      HIGHLIGHT_MS,
    );
    return () => {
      window.clearTimeout(settle);
      window.clearTimeout(done);
    };
  }, [animToken]);

  useIsomorphicLayoutEffect(() => {
    const dy = pendingShiftRef.current;
    pendingShiftRef.current = 0;
    if (dy === 0) return;

    if (!isPageScroll) {
      const el = scrollerRef.current;
      if (el) {
        el.scrollTop += dy;
        updateMetrics();
      }
    } else if (rootRef.current) {
      const scrollParent = getScrollParent(rootRef.current);
      if (scrollParent instanceof HTMLElement) {
        scrollParent.scrollTop += dy;
      } else {
        window.scrollBy(0, dy);
      }
      updateMetrics();
    }
  }, [rows, isPageScroll, updateMetrics]);

  const mountedRef = useRef(false);
  const requestedRef = useRef(-1);
  useIsomorphicLayoutEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!isPageScroll) {
      const el = scrollerRef.current;
      if (el) el.scrollTop = 0;
    } else if (rootRef.current && scrollTopRef.current > 0) {
      const scrollParent = getScrollParent(rootRef.current);
      if (scrollParent instanceof HTMLElement) {
        scrollParent.scrollTop = Math.max(
          0,
          scrollParent.scrollTop - scrollTopRef.current,
        );
      } else {
        window.scrollBy(0, -scrollTopRef.current);
      }
    }
    scrollTopRef.current = 0;
    setTopIndex(0);
    requestedRef.current = -1;
  }, [resetKey, isPageScroll]);

  // ───── Infinite scroll / Бесконечная прокрутка ─────
  useEffect(() => {
    if (!hasMore || loadingMore || loadMoreError) return;
    if (!onEndReachedRef.current) return;
    if (rows.length - end > endReachedThreshold) return;
    if (requestedRef.current === rows.length) return;
    requestedRef.current = rows.length;
    onEndReachedRef.current();
  }, [
    hasMore,
    loadingMore,
    loadMoreError,
    rows.length,
    end,
    endReachedThreshold,
  ]);

  const retryLoadMore = () => {
    requestedRef.current = rows.length;
    onEndReachedRef.current?.();
  };

  // ───── Keyboard and scrolling to a row / Клавиатура и прокрутка к строке ─────
  const rowDomId = (index: number) => `${gridId}-row-${index}`;

  const focusGrid = () => {
    const target = isPageScroll ? rootRef.current : scrollerRef.current;
    target?.focus({ preventScroll: true });
  };

  const ensureVisible = (index: number) => {
    if (!isPageScroll) {
      const el = scrollerRef.current;
      if (!el) return;
      const top = index * ROW_HEIGHT;
      const bottom = top + ROW_HEIGHT;
      const viewHeight = el.clientHeight - HEADER_HEIGHT;
      if (top < el.scrollTop) el.scrollTop = top;
      else if (bottom > el.scrollTop + viewHeight)
        el.scrollTop = bottom - viewHeight;
      return;
    }

    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;

    const scrollParent = getScrollParent(root);
    const scrollerTop =
      scrollParent instanceof HTMLElement
        ? scrollParent.getBoundingClientRect().top
        : 0;
    const viewHeight =
      scrollParent instanceof HTMLElement
        ? scrollParent.clientHeight
        : window.innerHeight;
    const bodyTop = body.getBoundingClientRect().top - scrollerTop;
    const rowTop = bodyTop + index * ROW_HEIGHT;
    const rowBottom = rowTop + ROW_HEIGHT;

    const headerBottom = headerScrollRef.current
      ? Math.max(
          0,
          headerScrollRef.current.getBoundingClientRect().bottom - scrollerTop,
        )
      : HEADER_HEIGHT;

    if (rowTop < headerBottom) {
      const delta = rowTop - headerBottom;
      if (scrollParent instanceof HTMLElement) scrollParent.scrollTop += delta;
      else window.scrollBy(0, delta);
    } else if (rowBottom > viewHeight) {
      const delta = rowBottom - viewHeight;
      if (scrollParent instanceof HTMLElement) scrollParent.scrollTop += delta;
      else window.scrollBy(0, delta);
    }
  };

  // ───── Context menu / Контекстное меню ─────
  const openRowMenu = (
    index: number,
    x: number,
    y: number,
    viaKeyboard: boolean,
  ): boolean => {
    if (!rowMenu) return false;
    const row = rows[index];
    const id = ids[index];
    const isSelected = selectable && selected.has(id);
    const targets = isSelected
      ? rows.filter((_, i) => selected.has(ids[i]))
      : [row];
    const items = rowMenu({ row, rows: targets });
    if (!items || items.length === 0) return false;
    if (selectable && !isSelected) {
      anchorRef.current = id;
      commitSelection(new Set([id]));
    }
    setActiveId(id);
    setMenu({ x, y, items, rowId: id, viaKeyboard });
    return true;
  };

  const openMenuAtActiveRow = () => {
    if (activeIndex < 0) return;
    ensureVisible(activeIndex);
    const el = document.getElementById(rowDomId(activeIndex));
    const rect = (el ?? rootRef.current)?.getBoundingClientRect();
    if (!rect) return;
    openRowMenu(activeIndex, rect.left + 32, rect.bottom - 4, true);
  };

  const menuRowId = menu?.rowId;
  useEffect(() => {
    if (menuRowId === undefined || indexById.has(menuRowId)) return;
    setMenu(null);
    focusGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuRowId, indexById]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const count = rows.length;
    if (count === 0) return;

    const page = Math.max(1, Math.floor(bodyViewportHeight / ROW_HEIGHT) - 1);
    let next = activeIndex;

    if (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey)) {
      e.preventDefault();
      openMenuAtActiveRow();
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        next = activeIndex < 0 ? 0 : Math.min(count - 1, activeIndex + 1);
        break;
      case "ArrowUp":
        next = activeIndex < 0 ? 0 : Math.max(0, activeIndex - 1);
        break;
      case "PageDown":
        next = Math.min(count - 1, Math.max(0, activeIndex) + page);
        break;
      case "PageUp":
        next = Math.max(0, Math.max(0, activeIndex) - page);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = count - 1;
        break;
      case " ":
        if (selectable && activeIndex >= 0) {
          toggleRow(activeIndex, !selected.has(ids[activeIndex]), e.shiftKey);
        }
        e.preventDefault();
        return;
      case "Enter":
        if (activeIndex >= 0) onRowActivate?.(rows[activeIndex]);
        e.preventDefault();
        return;
      case "a":
      case "A":
        if (selectable && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          const all = new Set(selected);
          for (const id of ids) all.add(id);
          commitSelection(all);
        }
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
    if (e.target !== e.currentTarget) return;
    if (activeIndex < 0 && rows.length > 0) setActiveId(ids[0]);
  };

  const handleGridContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.button !== 0) return;
    if (!rowMenu || activeIndex < 0) return;
    e.preventDefault();
    openMenuAtActiveRow();
  };

  // ───── Resizing columns / Изменение ширины колонок ─────
  const applyLayout = (override?: { id: string; width: number }) => {
    const el = rootRef.current;
    if (!el) return;
    const next = buildLayout(
      columns,
      (c) => (override && override.id === c.id ? override.width : widthOf(c)),
      selectable,
    );
    el.style.setProperty("--dg-columns", next.template);
    el.style.setProperty("--dg-min-width", `${next.total}px`);
  };

  const handleResizeDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    column: DataGridColumn<T>,
  ) => {
    if (e.button !== 0) return;
    const cell = e.currentTarget.parentElement;
    if (!cell) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const startWidth = cell.getBoundingClientRect().width;
    const { min, max } = limitsOf(column);
    resizeRef.current = {
      id: column.id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startWidth,
      min,
      max,
      width: startWidth,
    };
    setResizingId(column.id);
  };

  const handleResizeMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = resizeRef.current;
    if (!r || e.pointerId !== r.pointerId) return;
    r.width = Math.round(
      clamp(r.startWidth + e.clientX - r.startX, r.min, r.max),
    );
    applyLayout({ id: r.id, width: r.width });
  };

  const finishResize = (
    e: ReactPointerEvent<HTMLDivElement>,
    commit: boolean,
  ) => {
    const r = resizeRef.current;
    if (!r || e.pointerId !== r.pointerId) return;
    resizeRef.current = null;
    setResizingId(null);
    if (commit) setWidths((w) => ({ ...w, [r.id]: r.width }));
    else applyLayout();
  };

  const handleResizeKey = (
    e: KeyboardEvent<HTMLDivElement>,
    column: DataGridColumn<T>,
  ) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const cell = e.currentTarget.parentElement;
    if (!cell) return;
    e.preventDefault();
    e.stopPropagation();
    const step = e.shiftKey ? KEY_RESIZE_STEP_LARGE : KEY_RESIZE_STEP;
    const { min, max } = limitsOf(column);
    const current = Math.round(cell.getBoundingClientRect().width);
    const next = clamp(
      current + (e.key === "ArrowRight" ? step : -step),
      min,
      max,
    );
    setWidths((w) => ({ ...w, [column.id]: next }));
  };

  // ───── Render / Отрисовка ─────
  const indices: number[] = [];
  for (let i = start; i < end; i++) indices.push(i);
  if (activeIndex >= 0 && (activeIndex < start || activeIndex >= end)) {
    if (activeIndex < start) indices.unshift(activeIndex);
    else indices.push(activeIndex);
  }

  const renderRow = (
    index: number,
    row: T,
    id: DataGridRowId,
    ghost: boolean,
  ) => {
    const isSelected = selected.has(id);
    const isActive = !ghost && index === activeIndex;
    return (
      <div
        key={ghost ? `\u0000ghost:${String(id)}` : id}
        id={ghost ? undefined : rowDomId(index)}
        role="row"
        aria-rowindex={index + 2}
        aria-selected={selectable ? isSelected : undefined}
        aria-hidden={ghost || undefined}
        className={cx(
          styles.row,
          striped && index % 2 === 1 && styles.rowOdd,
          isSelected && styles.rowSelected,
          isActive && styles.rowActive,
          !ghost && anim?.entering.has(id) && styles.rowNew,
          ghost && styles.rowExit,
        )}
        style={{ transform: `translateY(${index * ROW_HEIGHT}px)` }}
        onClick={
          ghost
            ? undefined
            : () => {
                setActiveId(id);
                focusGrid();
                onRowClick?.(row);
              }
        }
        onDoubleClick={ghost ? undefined : () => onRowActivate?.(row)}
        onContextMenu={
          ghost
            ? undefined
            : (e) => {
                if (openRowMenu(index, e.clientX, e.clientY, false)) {
                  e.preventDefault();
                }
              }
        }
      >
        {selectable && (
          <div
            role="gridcell"
            aria-colindex={1}
            className={cx(styles.cell, styles.selectCell)}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              aria-label="Выбрать строку"
              tabIndex={-1}
              checked={isSelected}
              onChange={noop}
              onClick={(e) => toggleRow(index, !isSelected, e.shiftKey)}
            />
          </div>
        )}
        {columns.map((column, c) => (
          <div
            key={column.id}
            role="gridcell"
            aria-colindex={c + (selectable ? 2 : 1)}
            className={styles.cell}
            style={justify(column.align)}
          >
            <span className={styles.cellContent}>
              {column.cell(row, index)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const rowCount =
    totalCount !== undefined ? totalCount + 1 : hasMore ? -1 : rows.length + 1;
  const showEmpty =
    rows.length === 0 && !hasMore && !loadingMore && !loadMoreError;
  const showFooter = loadingMore || loadMoreError;

  useIsomorphicLayoutEffect(() => {
    if (!showFooter) return;
    if (!isPageScroll) {
      const el = scrollerRef.current;
      if (!el) return;
      if (
        el.scrollHeight - (el.scrollTop + el.clientHeight) <=
        ROW_HEIGHT + 2
      ) {
        el.scrollTop = el.scrollHeight;
      }
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const scrollParent = getScrollParent(root);
    if (scrollParent instanceof HTMLElement) {
      if (
        scrollParent.scrollHeight -
          (scrollParent.scrollTop + scrollParent.clientHeight) <=
        ROW_HEIGHT + 2
      ) {
        scrollParent.scrollTop = scrollParent.scrollHeight;
      }
    }
  }, [showFooter, isPageScroll]);

  const stickyTopCss =
    stickyTop !== undefined
      ? typeof stickyTop === "number"
        ? `${stickyTop}px`
        : stickyTop
      : undefined;

  const rootStyle = {
    "--dg-row-height": `${ROW_HEIGHT}px`,
    "--dg-header-height": `${HEADER_HEIGHT}px`,
    "--dg-columns": layout.template,
    "--dg-min-width": `${layout.total}px`,
    ...(stickyTopCss ? { "--dg-sticky-top": stickyTopCss } : {}),
    height: isPageScroll ? "auto" : height,
    ...style,
  } as CSSProperties;

  const headerNode = (
    <div ref={headerScrollRef} className={styles.headerScroller}>
      <div role="row" aria-rowindex={1} className={styles.header}>
        {selectable && (
          <div
            role="columnheader"
            aria-colindex={1}
            className={cx(styles.headerCell, styles.selectCell)}
          >
            <Checkbox
              aria-label="Выбрать все строки"
              tabIndex={-1}
              checked={allSelected}
              indeterminate={someSelected}
              disabled={rows.length === 0}
              onChange={toggleAll}
            />
          </div>
        )}
        {columns.map((column, c) => {
          const { min, max } = limitsOf(column);
          return (
            <div
              key={column.id}
              role="columnheader"
              aria-colindex={c + (selectable ? 2 : 1)}
              className={cx(
                styles.headerCell,
                "BodyTextBlockStyle",
                "BodyStrongTextBlockStyle",
              )}
              style={justify(column.align)}
            >
              <span className={styles.headerText}>{column.header}</span>
              {column.resizable !== false && (
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Изменить ширину колонки"
                  aria-valuenow={Math.round(widthOf(column))}
                  aria-valuemin={min}
                  aria-valuemax={Number.isFinite(max) ? max : undefined}
                  tabIndex={0}
                  className={cx(
                    styles.resizeHandle,
                    resizingId === column.id && styles.resizing,
                  )}
                  onPointerDown={(e) => handleResizeDown(e, column)}
                  onPointerMove={handleResizeMove}
                  onPointerUp={(e) => finishResize(e, true)}
                  onPointerCancel={(e) => finishResize(e, false)}
                  onKeyDown={(e) => handleResizeKey(e, column)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const bodyNode = (
    <div className={styles.canvas}>
      <div
        ref={bodyRef}
        role="rowgroup"
        className={cx(styles.body, anim?.moving && styles.moving)}
        style={{ height: rows.length * ROW_HEIGHT }}
      >
        {anim?.exiting.map((g) => renderRow(g.index, g.row, g.id, true))}
        {indices.map((index) =>
          renderRow(index, rows[index], ids[index], false),
        )}
      </div>

      {showFooter && (
        <div
          className={styles.footer}
          style={{
            // Ширина видимой области без отступов: в режиме bleed они заходят под панель
            width: viewport.w
              ? `calc(${viewport.w}px - var(--dg-edge-start, 0px) - var(--dg-edge-end, 0px))`
              : undefined,
          }}
          role={loadingMore ? "status" : "alert"}
        >
          {loadingMore ? (
            <ProgressRing loading size={20} aria-label="Загрузка" />
          ) : (
            <>
              <span className={cx(styles.footerError, "BodyTextBlockStyle")}>
                Не удалось загрузить данные.
              </span>
              <Button onClick={retryLoadMore}>Повторить</Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Отдаём подложку хедеру страницы: он растягивается вниз на высоту нашей шапки.
  // Layout-эффект, чтобы подложка появилась в том же кадре, когда мы её убираем.
  const stuckOnPage = isPageScroll && pageSticky !== null && headerStuck;
  useIsomorphicLayoutEffect(() => {
    if (!pageSticky || !stuckOnPage) return undefined;
    pageSticky.setStuckExtra(gridId, headerScrollRef.current?.offsetHeight ?? HEADER_HEIGHT);
    return () => pageSticky.setStuckExtra(gridId, 0);
  }, [pageSticky, stuckOnPage, gridId]);

  const gridAriaProps = {
    role: "grid" as const,
    tabIndex: 0,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-rowcount": rowCount,
    "aria-colcount": columns.length + (selectable ? 1 : 0),
    "aria-multiselectable": selectable || undefined,
    "aria-activedescendant":
      activeIndex >= 0 ? rowDomId(activeIndex) : undefined,
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onContextMenu: handleGridContextMenu,
  };

  return (
    <div
      ref={rootRef}
      {...(isPageScroll ? gridAriaProps : {})}
      className={cx(
        styles.root,
        "BodyTextBlockStyle",
        striped && styles.striped,
        !isPageScroll && styles.containedScroll,
        isPageScroll && bleed && styles.bleed,
        stuckOnPage && styles.stuck,
        className,
      )}
      style={rootStyle}
    >
      {isPageScroll ? (
        <>
          {headerNode}
          <div
            ref={bodyScrollRef}
            className={styles.bodyScroller}
            onScroll={handleHorizontalScroll}
          >
            {bodyNode}
          </div>
        </>
      ) : (
        <div
          ref={scrollerRef}
          {...gridAriaProps}
          className={styles.scroller}
          onScroll={updateMetrics}
        >
          <div className={styles.canvas}>
            {headerNode}
            {bodyNode}
          </div>
        </div>
      )}

      {showEmpty && (
        <div className={cx(styles.empty, "BodyTextBlockStyle")}>
          {emptyContent}
        </div>
      )}

      {menu && (
        <ContextMenu
          items={menu.items}
          x={menu.x}
          y={menu.y}
          activateFirst={menu.viaKeyboard}
          aria-label="Действия со строкой"
          onClose={(restoreFocus) => {
            setMenu(null);
            if (restoreFocus) focusGrid();
          }}
        />
      )}
    </div>
  );
}

export default DataGrid;
