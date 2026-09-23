/**
 * Point reduction for the NAV chart.
 *
 * There was none: every date in the selected window became a row, and every row
 * a vertex on every series. A ten-year window is ~2,500 trading days, and the
 * chart is routinely asked to draw several pinned funds at once — so ag-charts
 * was being handed five figures of vertices for a plot a few hundred pixels
 * wide, where all but a few hundred of them land on a pixel another vertex
 * already occupies.
 *
 * ## Why min/max decimation rather than a uniform stride
 *
 * Taking every Nth date is cheaper but drops extremes, so a one-day crash or
 * spike disappears when it happens to fall between samples — which is exactly
 * the feature someone reads a NAV chart to find. Min/max decimation keeps, for
 * each bucket, the dates carrying that bucket's highest and lowest values, so
 * the envelope of the series survives.
 *
 * ## Why it works on the shared date axis
 *
 * The chart merges every series into one row per date (`{ date, fund_0,
 * fund_1, ... }`), so the series cannot be thinned independently — dropping a
 * date from one would punch a hole in the others. Selection therefore happens
 * once over the date axis, considering all series, and every series is sampled
 * at the same dates.
 */
/**
 * Upper bound on rows handed to the chart.
 *
 * Roughly two vertices per horizontal pixel at desktop width, which is past the
 * point where more data can change what is drawn. Each bucket can contribute
 * both a minimum and a maximum, so the bucket count is half this.
 */
export const MAX_CHART_POINTS = 600;
/**
 * Picks the dates to plot, preserving order, first, last, and per-bucket
 * extremes across every series.
 *
 * Returns `activeDates` unchanged when it is already within budget, so short
 * windows are untouched and pay nothing.
 */
export function selectChartDates(
  activeDates: string[],
  seriesValueMaps: ReadonlyArray<Map<string, number>>,
  maxPoints: number = MAX_CHART_POINTS,
  /**
   * Dates that must survive thinning.
   *
   * A category-axis cross-line is positioned by category, so ag-charts drops it
   * without complaint when its date is not among the plotted ones. That is how
   * the "today" rule marking the end of measured data disappeared at a
   * hundred-year horizon — the exact case where the reader most needs it.
   */
  pinnedDates: ReadonlyArray<string | null | undefined> = []
): string[] {
  if (activeDates.length <= maxPoints || maxPoints < 4) return activeDates;
  // Two candidates per bucket, minus the endpoints which are always kept.
  const buckets = Math.max(1, Math.floor((maxPoints - 2) / 2));
  const stride = activeDates.length / buckets;
  // A Set of indices rather than of dates: duplicate dates would collapse into
  // one entry and silently shorten the axis.
  const keep = new Set<number>([0, activeDates.length - 1]);
  for (const pinned of pinnedDates) {
    if (!pinned) continue;
    const index = activeDates.indexOf(pinned);
    if (index >= 0) keep.add(index);
  }
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * stride);
    const end = Math.min(Math.floor((b + 1) * stride), activeDates.length);
    let minIdx = -1;
    let maxIdx = -1;
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = start; i < end; i++) {
      const date = activeDates[i];
      for (const valueMap of seriesValueMaps) {
        const value = valueMap.get(date);
        // Gaps are normal: a fund that did not exist yet, or a holiday for one
        // scheme but not another, has no value on that date.
        if (value === undefined || !Number.isFinite(value)) continue;
        if (value < minVal) {
          minVal = value;
          minIdx = i;
        }
        if (value > maxVal) {
          maxVal = value;
          maxIdx = i;
        }
      }
    }
    // A bucket with no data anywhere still contributes its first date, so a gap
    // stays visible as a gap instead of being closed up.
    if (minIdx === -1 && maxIdx === -1) {
      if (start < activeDates.length) keep.add(start);
      continue;
    }
    if (minIdx !== -1) keep.add(minIdx);
    if (maxIdx !== -1) keep.add(maxIdx);
  }
  const indices = Array.from(keep).sort((a, b) => a - b);
  return indices.map((i) => activeDates[i]);
}
