import React from 'react';
import styles from './Skeleton.module.scss';
/**
 * Route and region placeholders.
 *
 * App Router streams a `loading.tsx` immediately on navigation, before any data
 * resolves — so what lives in here is what decides whether a route change feels
 * instant. Most routes had no `loading.tsx` at all and the four that did
 * rendered a centred spinner, which is why navigation looked like nothing had
 * happened.
 *
 * Everything here is a server component with no client JS: a placeholder that
 * waits for hydration to appear would defeat its own purpose.
 */
/** Heights are passed through so a block can match the element it stands in for. */
const Block = ({ className, height }: { className?: string; height?: string }) => (
  <div className={`${styles.shimmer} ${className ?? ''}`.trim()} style={height ? { height } : undefined} />
);
/** One ValuePicker-shaped placeholder: label above, control body below. */
export const PickerSkeleton = () => (
  <div className={styles.picker}>
    <Block className={styles.pickerLabel} />
    <Block className={styles.pickerBody} />
  </div>
);
/**
 * Chart-area placeholder, drawn as a plot frame with bars rather than one flat
 * rectangle so the axes and plot origin land where the real chart will put them.
 *
 * The bar heights are fixed rather than random: a server-rendered random value
 * would differ from the client's and trip hydration.
 */
export const ChartSkeleton = ({ label = 'Loading chart' }: { label?: string }) => (
  <div className={styles.chart} role="status" aria-live="polite">
    <span className={styles.srOnly}>{label}</span>
    {[38, 55, 47, 68, 60, 78, 71, 88].map((pct, i) => (
      <Block key={i} className={styles.bar} height={`${pct}%`} />
    ))}
  </div>
);
/** A row of NAV/return stat cards. */
export const StatRowSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className={styles.statRow}>
    {Array.from({ length: count }, (_, i) => (
      <Block key={i} className={styles.stat} />
    ))}
  </div>
);
/**
 * Whole-route placeholder for a calculator: input column beside the output.
 *
 * `withChart` is the only axis that matters for perceived layout stability —
 * the pages that render a chart reserve a tall region and the ones that do not
 * must not, or the skeleton itself causes the jump it exists to prevent.
 */
export const CalculatorSkeleton = ({
  withChart = true,
  pickers = 4,
}: {
  withChart?: boolean;
  pickers?: number;
}) => (
  <div className={styles.page} role="status" aria-live="polite">
    <span className={styles.srOnly}>Loading page</span>
    <Block className={styles.title} />
    <div className={styles.columns}>
      <div className={styles.inputsCol}>
        {Array.from({ length: pickers }, (_, i) => (
          <PickerSkeleton key={i} />
        ))}
      </div>
      <div className={styles.outputCol}>
        <StatRowSkeleton />
        {withChart && <ChartSkeleton />}
      </div>
    </div>
  </div>
);
/**
 * The two-value row inside a fund stat card (start NAV / end NAV + change).
 *
 * Replaces a `Spinner` labelled "Loading NAV data...". The spinner was both the
 * most-reported symptom and a layout problem: it is a different height from the
 * content it stands in for, so every card resized when the NAV landed. Matching
 * the real shape keeps the row still.
 */
export const NavValuesSkeleton = ({ label = 'Loading NAV data' }: { label?: string }) => (
  <div className={styles.navValues} role="status" aria-live="polite">
    <span className={styles.srOnly}>{label}</span>
    <div className={styles.navValueCell}>
      <Block height="0.7rem" />
      <Block height="1.05rem" />
    </div>
    <div className={styles.navValueCell}>
      <Block height="0.7rem" />
      <Block height="1.05rem" />
    </div>
  </div>
);
