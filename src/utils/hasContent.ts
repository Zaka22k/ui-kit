import type { ReactNode } from "react";

/**
 * `false` for nodes that render nothing: `undefined`, `null`, `false` and `""`.
 * `false` для узлов, которые ничего не рисуют: `undefined`, `null`, `false` и `""`.
 */
export const hasContent = (node: ReactNode): boolean =>
  node !== undefined && node !== null && node !== false && node !== "";
