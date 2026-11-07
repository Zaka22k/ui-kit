"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  ForwardedRef,
  InputHTMLAttributes,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  Ref,
} from "react";
import { createPortal, useFormStatus } from "react-dom";
import { ProgressRing } from "../ProgressRing";
import { cx } from "../utils/cx";
import { hasContent } from "../utils/hasContent";
import { useForwardedRef } from "../utils/useForwardedRef";
import { useIsomorphicLayoutEffect } from "../utils/useIsomorphicLayoutEffect";
import styles from "./ComboBox.module.css";

export type ComboBoxOption = string | object;

export interface ComboBoxOptionState {
  label: string;
  value: string;
  selected: boolean;
  active: boolean;
  index: number;
}

type OptionKey<T> = T extends string ? never : keyof T;

/**
 * Props shared by both modes.
 * Свойства, общие для обоих режимов.
 */
export interface ComboBoxBaseProps<T extends ComboBoxOption = ComboBoxOption>
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | "value"
    | "defaultValue"
    | "onChange"
    | "type"
    | "role"
    | "size"
    | "children"
    | "className"
    | "style"
    | "multiple"
  > {
  /** Options loaded so far. / Уже загруженные варианты. */
  options: readonly T[];
  valueKey?: OptionKey<T>;
  labelKey?: OptionKey<T>;
  getOptionValue?: (option: T) => string;
  getOptionLabel?: (option: T) => string;
  renderOption?: (option: T, state: ComboBoxOptionState) => ReactNode;
  /**
   * Filter loaded options by the typed text. `false` turns it off (use it with `onQueryChange`
   * when the server does the search).
   * Фильтрация загруженных вариантов по набранному тексту. `false` отключает её (вместе с
   * `onQueryChange`, если поиск делает сервер).
   */
  filter?: boolean | ((option: T, query: string, label: string) => boolean);
  /**
   * The typed text changed. It is called with `""` when the text is dropped (blur, choice).
   * Набранный текст изменился. С `""` вызывается, когда текст сброшен (потеря фокуса, выбор).
   */
  onQueryChange?: (query: string) => void;

  label?: ReactNode;
  labelPlacement?: "top" | "start";
  hint?: ReactNode;
  /** Ошибка валидации: подсвечивает рамку красным и выводит текст ошибки вместо `hint`. */
  error?: ReactNode | boolean;

  /** There is more data on the server. / На сервере есть ещё данные. */
  hasMore?: boolean;
  /** The next portion is loading: a ring is shown at the end. / Грузится следующая порция: в конце кольцо. */
  loadingMore?: boolean;
  /** Loading failed: a "retry" row is shown at the end. / Подгрузка упала: в конце строка «Повторить». */
  loadMoreError?: boolean;
  /**
   * The user got close to the end of the list: load the next portion.
   * Пользователь подошёл к концу списка: загрузите следующую порцию.
   */
  onEndReached?: () => void;
  /** How many options before the end `onEndReached` fires. Default 5. / За сколько пунктов до конца вызывается `onEndReached`. По умолчанию 5. */
  endReachedThreshold?: number;
  /** Total number of options on the server, for screen readers. / Всего вариантов на сервере, для скринридеров. */
  totalCount?: number;

  /** Shown when nothing matches; `null` hides the message. / Показывается, если ничего не найдено; `null` скрывает сообщение. */
  emptyLabel?: ReactNode;
  /** Text next to the loading ring. / Текст рядом с кольцом загрузки. */
  loadingLabel?: string;
  /** Text of the "retry" row. / Текст строки «Повторить». */
  loadMoreErrorLabel?: string;
  /** Text of the retry action. / Текст действия повтора. */
  retryLabel?: string;
  /** Accessible name of the chip remove button (multiple mode). / Доступное имя кнопки удаления метки (режим multiple). */
  removeLabel?: (label: string) => string;
  toggleLabel?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * One value; free text is allowed.
 * Одно значение; допустим произвольный текст.
 */
export interface ComboBoxSingleProps<T extends ComboBoxOption = ComboBoxOption> {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string, option: T | null) => void;
}

/**
 * Many values, only from the options; shown as chips.
 * Много значений, только из вариантов; показываются метками.
 */
export interface ComboBoxMultipleProps<
  T extends ComboBoxOption = ComboBoxOption,
> {
  multiple: true;
  value?: readonly string[];
  defaultValue?: readonly string[];
  /**
   * `options[i]` belongs to `values[i]`; it is `null` if that option has never been loaded.
   * `options[i]` относится к `values[i]`; `null`, если этот вариант ни разу не загружался.
   */
  onChange?: (values: string[], options: (T | null)[]) => void;
}

export type ComboBoxProps<T extends ComboBoxOption = ComboBoxOption> =
  ComboBoxBaseProps<T> & (ComboBoxSingleProps<T> | ComboBoxMultipleProps<T>);

const LIST_MAX_HEIGHT = 240;
const LIST_GAP = 8;
const DEFAULT_ITEM_HEIGHT = 32;

interface ListAnchor {
  left: number;
  width: number;
  top: number;
  bottom: number;
}

function readKey(option: object, key: PropertyKey): string {
  const v = (option as Record<PropertyKey, unknown>)[key];
  return v === undefined || v === null ? "" : String(v);
}

interface Item<T> {
  option: T;
  value: string;
  label: string;
}

const keyOf = (v: string | readonly string[] | undefined): string | undefined =>
  v === undefined
    ? undefined
    : typeof v === "string"
      ? `s:${v}`
      : `m:${v.join("\u0000")}`;

function ComboBoxInner<T extends ComboBoxOption>(
  {
    options,
    multiple = false,
    value,
    defaultValue,
    onChange,
    onQueryChange,
    valueKey,
    labelKey,
    getOptionValue,
    getOptionLabel,
    renderOption,
    filter = true,
    label,
    labelPlacement = "top",
    hint,
    error,
    hasMore = false,
    loadingMore = false,
    loadMoreError = false,
    onEndReached,
    endReachedThreshold = 5,
    totalCount,
    emptyLabel = "Нет вариантов",
    loadingLabel = "Загрузка",
    loadMoreErrorLabel = "Не удалось загрузить",
    retryLabel = "Повторить",
    removeLabel = (text: string) => `Удалить: ${text}`,
    toggleLabel = "Показать варианты",
    className,
    style,
    disabled,
    readOnly,
    placeholder,
    id,
    name,
    form,
    onKeyDown,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...rest
  }: ComboBoxProps<T>,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled);
  // While the form is sending, the input keeps focus (readOnly instead of disabled).
  // Пока форма отправляется, поле сохраняет фокус (readOnly вместо disabled).
  const locked = isDisabled || pending || Boolean(readOnly);
  const looksDisabled = isDisabled || pending;

  const { ref: inputRef, setRefs } = useForwardedRef<HTMLInputElement>(
    forwardedRef,
  );
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const listboxRef = useRef<HTMLDivElement | null>(null);

  const baseId = useId();
  const inputId = id ?? `${baseId}-input`;
  const labelId = `${baseId}-label`;
  const listId = `${baseId}-list`;
  const hintId = `${baseId}-hint`;
  const hasLabel = hasContent(label);

  const isInvalid =
    Boolean(error) || ariaInvalid === true || ariaInvalid === "true";
  const feedbackMessage =
    typeof error !== "boolean" && hasContent(error) ? error : hint;
  const hasFeedback = hasContent(feedbackMessage);

  const describedBy =
    [ariaDescribedBy, hasFeedback ? hintId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  const emptyValue = multiple ? [] : "";
  const [inner, setInner] = useState<string | readonly string[]>(
    defaultValue ?? emptyValue,
  );
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [anchor, setAnchor] = useState<ListAnchor | null>(null);

  const emitSingle = onChange as ComboBoxSingleProps<T>["onChange"];
  const emitMulti = onChange as ComboBoxMultipleProps<T>["onChange"];

  // Compare by content: an inline `defaultValue={[...]}` is a new array on every render.
  // Сравниваем по содержимому: `defaultValue={[...]}` на месте — каждый раз новый массив.
  const defaultKey = keyOf(defaultValue);
  const prevDefaultKeyRef = useRef(defaultKey);
  if (prevDefaultKeyRef.current !== defaultKey) {
    prevDefaultKeyRef.current = defaultKey;
    if (value === undefined) {
      setInner(defaultValue ?? emptyValue);
      setQuery(null);
    }
  }

  const resetToDefaultRef = useRef<() => void>(() => {});
  useEffect(() => {
    resetToDefaultRef.current = () => {
      if (value === undefined) setInner(defaultValue ?? emptyValue);
      setQuery(null);
      setOpen(false);
    };
  });

  useEffect(() => {
    const formEl = inputRef.current?.form;
    if (!formEl) return;
    const handleReset = () => resetToDefaultRef.current();
    formEl.addEventListener("reset", handleReset);
    return () => formEl.removeEventListener("reset", handleReset);
  }, [inputRef, form]);

  const raw = value !== undefined ? value : inner;
  const current = typeof raw === "string" ? raw : "";
  const selectedValues: readonly string[] =
    multiple && typeof raw !== "string" ? raw : [];

  const getValue = useCallback(
    (o: T): string => {
      if (getOptionValue) return getOptionValue(o);
      if (typeof o === "string") return o;
      const key = (valueKey ?? labelKey) as PropertyKey | undefined;
      return key === undefined ? "" : readKey(o as object, key);
    },
    [getOptionValue, valueKey, labelKey],
  );

  const getLabel = useCallback(
    (o: T): string => {
      if (getOptionLabel) return getOptionLabel(o);
      if (typeof o === "string") return o;
      const key = (labelKey ?? valueKey) as PropertyKey | undefined;
      return key === undefined ? "" : readKey(o as object, key);
    },
    [getOptionLabel, valueKey, labelKey],
  );

  // Every option seen so far: chips and the field text keep their labels
  // after the option leaves the loaded page.
  // Все когда-либо виденные варианты: метки и текст поля сохраняют подписи,
  // даже когда вариант выпал из загруженной страницы.
  const knownRef = useRef(new Map<string, Item<T>>());

  const items = useMemo<Item<T>[]>(() => {
    const list = options.map((option) => ({
      option,
      value: getValue(option),
      label: getLabel(option),
    }));
    for (const item of list) knownRef.current.set(item.value, item);
    return list;
  }, [options, getValue, getLabel]);

  const visible = useMemo(() => {
    if (query === null || filter === false) return items;
    if (typeof filter === "function") {
      return items.filter((i) => filter(i.option, query, i.label));
    }
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query, filter]);

  const showLoading = loadingMore;
  const showError = loadMoreError && !loadingMore;
  const showEmpty =
    visible.length === 0 &&
    !hasMore &&
    !loadingMore &&
    !loadMoreError &&
    hasContent(emptyLabel);
  const navCount = visible.length + (showError ? 1 : 0);
  const listVisible =
    open &&
    !locked &&
    (visible.length > 0 || showLoading || showError || showEmpty);
  const active = activeIndex < navCount ? activeIndex : -1;

  const labelOf = (v: string): string => knownRef.current.get(v)?.label ?? v;
  const displayText = multiple ? (query ?? "") : (query ?? labelOf(current));

  const onEndReachedRef = useRef(onEndReached);
  useEffect(() => {
    onEndReachedRef.current = onEndReached;
  });
  const requestedRef = useRef(-1);

  useEffect(() => {
    if (!hasMore) requestedRef.current = -1;
  }, [hasMore]);

  const footerKey = `${showLoading}|${showError}|${showEmpty}`;
  const visibleCount = visible.length;

  useIsomorphicLayoutEffect(() => {
    if (!listVisible) {
      setAnchor(null);
      return;
    }

    const update = () => {
      const field = fieldRef.current;
      if (!field) return;
      const rect = field.getBoundingClientRect();
      // clientHeight does not include the horizontal scrollbar
      // clientHeight не включает горизонтальную полосу прокрутки
      const vh = document.documentElement.clientHeight;
      const need = (listRef.current?.offsetHeight ?? LIST_MAX_HEIGHT) + LIST_GAP;
      const below = vh - rect.bottom;
      setPlacement(below < need && rect.top > below ? "top" : "bottom");
      const next: ListAnchor = {
        left: rect.left,
        width: rect.width,
        top: rect.bottom,
        bottom: vh - rect.top,
      };
      setAnchor((prev) =>
        prev &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.top === next.top &&
        prev.bottom === next.bottom
          ? prev
          : next,
      );
    };
    const onScroll = (e: Event) => {
      // scrolling inside the list does not move the field
      // прокрутка внутри списка поле не двигает
      if (e.target instanceof Node && listRef.current?.contains(e.target)) {
        return;
      }
      update();
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [listVisible, visibleCount, footerKey, selectedValues.length]);

  useEffect(() => {
    if (!listVisible || active < 0) return;
    document
      .getElementById(`${listId}-${active}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [listVisible, active, listId]);

  // ───── Loading by portions / Подгрузка порциями ─────
  const checkEnd = useCallback(() => {
    if (!listVisible || !hasMore || loadingMore || loadMoreError) return;
    if (!onEndReachedRef.current) return;
    const el = listboxRef.current;
    if (!el) return;
    const itemHeight =
      (el.firstElementChild as HTMLElement | null)?.offsetHeight ||
      DEFAULT_ITEM_HEIGHT;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining > endReachedThreshold * itemHeight) return;
    if (requestedRef.current === items.length) return;
    requestedRef.current = items.length;
    onEndReachedRef.current();
  }, [
    listVisible,
    hasMore,
    loadingMore,
    loadMoreError,
    endReachedThreshold,
    items.length,
  ]);

  useEffect(() => {
    checkEnd();
  }, [checkEnd, visibleCount, anchor]);

  const retryLoadMore = () => {
    requestedRef.current = items.length;
    onEndReachedRef.current?.();
  };

  // ───── Changing the value / Изменение значения ─────
  const commit = (next: string, option: T | null) => {
    if (value === undefined) setInner(next);
    emitSingle?.(next, option);
  };

  const commitMany = (next: string[]) => {
    if (value === undefined) setInner(next);
    emitMulti?.(
      next,
      next.map((v) => knownRef.current.get(v)?.option ?? null),
    );
  };

  const resetQuery = () => {
    if (query !== null) onQueryChange?.("");
    setQuery(null);
  };

  const selectItem = (item: Item<T>) => {
    if (multiple) {
      commitMany(
        selectedValues.includes(item.value)
          ? selectedValues.filter((v) => v !== item.value)
          : [...selectedValues, item.value],
      );
      // the text is dropped, so the full list is shown again: follow the item
      // текст сброшен, снова виден весь список: идём за пунктом
      resetQuery();
      setActiveIndex(items.indexOf(item));
      inputRef.current?.focus();
      return;
    }
    commit(item.value, item.option);
    resetQuery();
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeValue = (v: string) => {
    commitMany(selectedValues.filter((x) => x !== v));
    inputRef.current?.focus();
  };

  const activate = (index: number) => {
    const item = visible[index];
    if (item) selectItem(item);
    else if (showError && index === visible.length) retryLoadMore();
  };

  const openList = (edge?: "first" | "last") => {
    const selected = multiple ? -1 : items.findIndex((i) => i.value === current);
    const count = items.length + (showError ? 1 : 0);
    resetQuery();
    requestedRef.current = -1;
    setOpen(true);
    setActiveIndex(
      selected >= 0
        ? selected
        : edge === "last"
          ? count - 1
          : edge
            ? 0
            : -1,
    );
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (locked) return;
    const text = e.target.value;
    setQuery(text);
    setOpen(true);
    setActiveIndex(-1);
    requestedRef.current = -1;
    onQueryChange?.(text);
    if (multiple) return;
    const lower = text.toLowerCase();
    const matched = items.find((i) => i.label.toLowerCase() === lower);
    commit(matched ? matched.value : text, matched ? matched.option : null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || locked) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp": {
        e.preventDefault();
        const down = e.key === "ArrowDown";
        if (!listVisible) {
          openList(down ? "first" : "last");
          return;
        }
        const n = navCount;
        setActiveIndex(
          active < 0 ? (down ? 0 : n - 1) : (active + (down ? 1 : -1) + n) % n,
        );
        return;
      }
      case "Enter": {
        if (e.nativeEvent.isComposing) return;
        if (!listVisible) {
          setOpen(false);
          return;
        }
        // the list is open: Enter belongs to it, the form is not sent
        // список открыт: Enter принадлежит ему, форма не отправляется
        e.preventDefault();
        if (active >= 0) activate(active);
        else setOpen(false);
        return;
      }
      case "Backspace": {
        if (multiple && selectedValues.length > 0 && !e.currentTarget.value) {
          e.preventDefault();
          commitMany(selectedValues.slice(0, -1));
        }
        return;
      }
      case "Escape": {
        if (listVisible) {
          // do not let a parent Modal close along with the list
          // не даём родительскому Modal закрыться вместе со списком
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          return;
        }
        // second Escape clears the text (WAI-ARIA combobox)
        // второй Escape очищает текст (WAI-ARIA combobox)
        const hasText = multiple
          ? e.currentTarget.value !== ""
          : displayText !== "";
        if (!hasText) return;
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        if (multiple) resetQuery();
        else {
          commit("", null);
          if (query !== null) onQueryChange?.("");
          setQuery(null);
        }
        return;
      }
      case "Tab":
        setOpen(false);
        return;
    }
  };

  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(next)) return;
    if (next && listRef.current?.contains(next)) return;
    setOpen(false);
    resetQuery();
  };

  const toggle = () => {
    if (locked) return;
    inputRef.current?.focus();
    if (listVisible) setOpen(false);
    else openList();
  };

  const listStyle: CSSProperties = anchor
    ? {
        position: "fixed",
        left: anchor.left,
        width: anchor.width,
        ...(placement === "top"
          ? { bottom: anchor.bottom + LIST_GAP }
          : { top: anchor.top + LIST_GAP }),
      }
    : // measured before it is shown / сначала измеряется, потом показывается
      { position: "fixed", left: 0, top: 0, visibility: "hidden" };

  const listIsFiltered =
    query !== null && filter !== false && visible.length !== items.length;
  const setSize =
    totalCount !== undefined && !listIsFiltered
      ? totalCount
      : hasMore
        ? -1
        : undefined;

  const hiddenValues = multiple ? selectedValues : name ? [current] : [];

  return (
    <div
      className={cx(
        styles.root,
        labelPlacement === "start" && styles.labelStart,
        looksDisabled && styles.disabled,
        isInvalid && styles.invalid,
        multiple && styles.multi,
        listVisible && styles.open,
        className,
      )}
      style={style}
    >
      {hasLabel && (
        <label
          id={labelId}
          className={cx(styles.label, "BodyTextBlockStyle")}
          htmlFor={inputId}
        >
          {label}
        </label>
      )}

      <div className={styles.fieldWrapper}>
        <div ref={fieldRef} className={styles.field} onBlur={handleFieldBlur}>
          <div className={styles.control}>
            {name &&
              !isDisabled &&
              hiddenValues.map((v) => (
                <input
                  key={v}
                  type="hidden"
                  name={name}
                  form={form}
                  value={v}
                />
              ))}
            <div className={styles.inputArea}>
              {multiple &&
                selectedValues.map((v) => {
                  const text = labelOf(v);
                  return (
                    <span key={v} className={styles.chip}>
                      <span className={styles.chipLabel}>{text}</span>
                      <button
                        type="button"
                        tabIndex={-1}
                        className={styles.chipRemove}
                        aria-label={removeLabel(text)}
                        disabled={locked}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => removeValue(v)}
                      >
                        <svg
                          viewBox="0 0 16 16"
                          width="10"
                          height="10"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path
                            d="m4 4 8 8M12 4l-8 8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </span>
                  );
                })}
              <input
                autoComplete="off"
                {...rest}
                ref={setRefs}
                id={inputId}
                form={form}
                className={cx(styles.input, "BodyTextBlockStyle")}
                type="text"
                role="combobox"
                disabled={isDisabled}
                readOnly={pending || readOnly}
                placeholder={
                  multiple && selectedValues.length > 0 ? undefined : placeholder
                }
                value={displayText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                aria-expanded={listVisible}
                aria-controls={listVisible ? listId : undefined}
                aria-autocomplete={filter === false ? "none" : "list"}
                aria-disabled={pending || undefined}
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={describedBy}
                aria-invalid={isInvalid || undefined}
                aria-activedescendant={
                  listVisible && active >= 0 ? `${listId}-${active}` : undefined
                }
              />
            </div>
            <button
              type="button"
              tabIndex={-1}
              className={styles.button}
              aria-label={toggleLabel}
              disabled={locked}
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggle}
            >
              <svg
                className={styles.chevron}
                viewBox="0 0 16 16"
                width="12"
                height="12"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M3.5 6 8 10.5 12.5 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {listVisible &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                ref={listRef}
                className={cx(
                  styles.list,
                  placement === "top" && styles.listTop,
                )}
                style={listStyle}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div
                  ref={listboxRef}
                  id={listId}
                  role="listbox"
                  className={styles.listbox}
                  style={{ maxHeight: LIST_MAX_HEIGHT }}
                  aria-multiselectable={multiple || undefined}
                  aria-busy={loadingMore || undefined}
                  aria-label={hasLabel ? undefined : ariaLabel}
                  aria-labelledby={hasLabel ? labelId : ariaLabelledBy}
                  onScroll={checkEnd}
                >
                  {visible.map((item, index) => {
                    const selected = multiple
                      ? selectedValues.includes(item.value)
                      : item.value === current;
                    const isActive = index === active;
                    return (
                      <div
                        key={`${item.value}\u0000${index}`}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={selected}
                        aria-setsize={setSize}
                        aria-posinset={setSize === undefined ? undefined : index + 1}
                        className={cx(
                          styles.option,
                          "BodyTextBlockStyle",
                          isActive && styles.optionActive,
                          selected && styles.optionSelected,
                        )}
                        onClick={() => selectItem(item)}
                        onMouseMove={() => {
                          if (!isActive) setActiveIndex(index);
                        }}
                      >
                        <div className={styles.optionContent}>
                          {renderOption
                            ? renderOption(item.option, {
                                label: item.label,
                                value: item.value,
                                selected,
                                active: isActive,
                                index,
                              })
                            : item.label}
                        </div>
                        {selected && (
                          <svg
                            className={styles.check}
                            viewBox="0 0 16 16"
                            width="12"
                            height="12"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path
                              d="m3 8.5 3.2 3.2L13 4.8"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                  {showError && (
                    <div
                      id={`${listId}-${visible.length}`}
                      role="option"
                      aria-selected={false}
                      className={cx(
                        styles.option,
                        styles.retry,
                        "BodyTextBlockStyle",
                        active === visible.length && styles.optionActive,
                      )}
                      onClick={retryLoadMore}
                      onMouseMove={() => {
                        if (active !== visible.length) {
                          setActiveIndex(visible.length);
                        }
                      }}
                    >
                      <div className={styles.optionContent}>
                        <span className={styles.retryMessage}>
                          {loadMoreErrorLabel}
                        </span>
                        <span className={styles.retryAction}>{retryLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
                {(showLoading || showEmpty) && (
                  <div
                    role="status"
                    className={cx(styles.footer, "BodyTextBlockStyle")}
                  >
                    {showLoading ? (
                      <>
                        <ProgressRing loading size={16} />
                        <span>{loadingLabel}</span>
                      </>
                    ) : (
                      emptyLabel
                    )}
                  </div>
                )}
              </div>,
              document.body,
            )}
        </div>

        {hasFeedback && (
          <div id={hintId} className={cx(styles.hint, "CaptionTextBlockStyle")}>
            {feedbackMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export const ComboBox = forwardRef(ComboBoxInner) as <
  T extends ComboBoxOption = string,
>(
  props: ComboBoxProps<T> & { ref?: Ref<HTMLInputElement> },
) => ReactElement;
