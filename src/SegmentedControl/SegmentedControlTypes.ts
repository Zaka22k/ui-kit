"use client";

import { createContext, type ReactNode, type SyntheticEvent } from "react";

export type SegmentValue = string | number;

export interface SegmentItem<T extends SegmentValue = SegmentValue> {
  value: T;
  label?: ReactNode;
  icon?: ReactNode;
  activeIcon?: ReactNode;
  // badge удален
  disabled?: boolean;
  tooltip?: string;
}

interface SegmentedContextValue {
  activeValue: SegmentValue | undefined;
  selectedValues: SegmentValue[];
  isMultiple: boolean;
  onTrigger: (e: SyntheticEvent, val: SegmentValue) => void;
  registerNode: (val: SegmentValue, node: HTMLButtonElement | null) => void;
  disabled?: boolean;
}

export const SegmentedContext = createContext<SegmentedContextValue | null>(
  null,
);
