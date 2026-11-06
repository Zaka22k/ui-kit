/**
 * Joins class names, skipping falsy values.
 * Склеивает имена классов, пропуская ложные значения.
 */
export const cx = (
  ...classes: Array<string | false | null | undefined>
): string => classes.filter(Boolean).join(" ");
