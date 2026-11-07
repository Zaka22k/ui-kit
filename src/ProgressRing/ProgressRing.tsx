import { forwardRef, type SVGProps } from "react";
import { cx } from "../utils/cx";
import styles from "./ProgressRing.module.css";

/**
 * An accessible name is required: pass `aria-label` or `aria-labelledby`,
 * or mark a purely decorative ring with `aria-hidden`.
 * Нужно доступное имя: передайте `aria-label` или `aria-labelledby`,
 * а чисто декоративное кольцо пометьте `aria-hidden`.
 */
type ProgressRingA11y =
  | { "aria-label": string; "aria-labelledby"?: string }
  | { "aria-labelledby": string; "aria-label"?: string }
  | { "aria-hidden": true | "true" };

export type ProgressRingProps = Omit<
  SVGProps<SVGSVGElement>,
  "role" | "width" | "height" | "viewBox" | "aria-hidden"
> & {
  /** Shows the ring. / Показывает кольцо. */
  loading?: boolean;
  /** Width and height: pixels or any CSS length. / Ширина и высота: пиксели или любая CSS-длина. */
  size?: number | string;
  /** Percent from 0 to 100; omitted means indeterminate. / Процент от 0 до 100; без него режим неопределённый. */
  progress?: number;
  /** Stroke width in the 24×24 viewBox, limited to 0–22. / Толщина линии в viewBox 24×24, ограничена 0–22. */
  strokeWidth?: number;
  /**
   * Keep the ring's box in the layout while it is hidden (default). When `false`,
   * a hidden ring takes no space.
   * Сохранять место кольца в разметке, пока оно скрыто (по умолчанию). При `false`
   * скрытое кольцо места не занимает.
   */
  reserveSpace?: boolean;
} & ProgressRingA11y;

const MAX_STROKE = 22;

const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(
  function ProgressRing(
    {
      loading = false,
      size = 28,
      progress,
      strokeWidth = 2.5,
      reserveSpace = true,
      className = "",
      ...props
    },
    ref,
  ) {
    const isDeterminate =
      typeof progress === "number" && Number.isFinite(progress);

    const clampedProgress = isDeterminate
      ? Math.min(100, Math.max(0, progress))
      : 75;

    const safeStroke = Number.isFinite(strokeWidth)
      ? Math.min(MAX_STROKE, Math.max(0, strokeWidth))
      : 2.5;
    const radius = (24 - safeStroke) / 2;

    const decorative =
      (props as { "aria-hidden"?: boolean | "true" })["aria-hidden"] ===
        true || (props as { "aria-hidden"?: string })["aria-hidden"] === "true";

    return (
      <svg
        {...props}
        ref={ref}
        viewBox="0 0 24 24"
        className={cx(
          styles.ring,
          loading && styles.visible,
          !reserveSpace && styles.collapse,
          isDeterminate ? styles.determinate : styles.indeterminate,
          className,
        )}
        fill="none"
        role="progressbar"
        aria-hidden={!loading || decorative}
        aria-valuenow={isDeterminate ? clampedProgress : undefined}
        aria-valuemin={isDeterminate ? 0 : undefined}
        aria-valuemax={isDeterminate ? 100 : undefined}
        focusable="false"
        width={size}
        height={size}
      >
        {isDeterminate && (
          <circle
            className={styles.track}
            cx="12"
            cy="12"
            r={radius}
            strokeWidth={safeStroke}
          />
        )}

        <circle
          className={styles.indicator}
          cx="12"
          cy="12"
          r={radius}
          strokeWidth={safeStroke}
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - clampedProgress}
        />
      </svg>
    );
  },
);

export default ProgressRing;
