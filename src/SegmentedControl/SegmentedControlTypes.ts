"use client";

import { createContext, type ReactNode } from "react";

export type SegmentValue = string | number;

export type SegmentVariant = "solid" | "glass" | "pills";

export interface SegmentItem<T extends SegmentValue = SegmentValue> {
  /** Unique id of the segment. / Уникальный идентификатор сегмента. */
  value: T;
  /** Text of the segment. / Текст сегмента. */
  label?: ReactNode;
  /** Icon of the segment. / Иконка сегмента. */
  icon?: ReactNode;
  /** Icon shown only while the segment is selected. / Иконка только для выбранного состояния. */
  activeIcon?: ReactNode;
  /** Disables this segment only. / Блокирует только этот сегмент. */
  disabled?: boolean;
  /** Native tooltip; also the accessible name of an icon-only segment. / Нативная подсказка; для сегмента без текста также его доступное имя. */
  tooltip?: string;
  /** Accessible name; needed for an icon-only segment without `tooltip`. / Доступное имя; нужно сегменту без текста и без `tooltip`. */
  "aria-label"?: string;
}

export interface SegmentedContextValue {
  activeValue: SegmentValue | undefined;
  selectedValues: SegmentValue[];
  isMultiple: boolean;
  variant: SegmentVariant;
  /** The only tabbable segment in single mode (roving tabindex). / Единственный сегмент в табуляции в одиночном режиме. */
  tabStop: SegmentValue | undefined;
  onTrigger: (val: SegmentValue) => void;
  registerNode: (val: SegmentValue, node: HTMLButtonElement | null) => void;
  disabled?: boolean;
}

export const SegmentedContext = createContext<SegmentedContextValue | null>(
  null,
);
