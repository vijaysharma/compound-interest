/*
 * Chart palette resolution.
 *
 * ag-charts renders to a <canvas>, so it cannot consume `var(--token)` strings
 * the way CSS can — every colour handed to it must already be resolved. These
 * helpers read the theme tokens off the document at call time so charts follow
 * whichever theme block is active (light, fantasy, dark) instead of hardcoding
 * a palette that only looks right in one of them.
 *
 * The fallbacks mirror the light-theme values in `_theme.scss` and are what get
 * used during SSR, where there is no document to read from.
 */
const SERIES_TOKENS = [
  '--chart-series-1',
  '--chart-series-2',
  '--chart-series-3',
  '--chart-series-4',
  '--chart-series-5',
  '--chart-series-6',
  '--chart-series-7',
  '--chart-series-8',
] as const;
/*
 * Primary-anchored categorical palette. The first series is the brand primary;
 * the rest stay perceptually distinct so several funds plotted together remain
 * separable. Kept in sync with the `--chart-series-*` tokens in `_theme.scss`.
 */
const SERIES_FALLBACKS = [
  '#6d0b74',
  '#0891b2',
  '#c2410c',
  '#15803d',
  '#9333ea',
  '#be123c',
  '#0369a1',
  '#a16207',
] as const;
const CHROME_FALLBACKS: Record<string, string> = {
  '--chart-axis-line': '#e2e8f0',
  '--chart-grid-line': '#f1f5f9',
  '--chart-label-text': '#757575',
  '--chart-title-text': '#212121',
  '--chart-tooltip-bg': '#ffffff',
  '--chart-tooltip-border': '#e2e8f0',
  '--chart-tooltip-text': '#212121',
  '--color-primary': '#6d0b74',
  '--color-primary-content': '#ffffff',
};
/*
 * Resolve a single theme token to a concrete colour string.
 */
export const resolveThemeToken = (token: string, fallback = ''): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback || CHROME_FALLBACKS[token] || '';
  }
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
  return value || fallback || CHROME_FALLBACKS[token] || '';
};
/*
 * The resolved categorical series palette, in order.
 */
export const getChartSeriesColors = (): string[] =>
  SERIES_TOKENS.map((token, index) => resolveThemeToken(token, SERIES_FALLBACKS[index]));
/*
 * Pick a series colour by index, wrapping around the palette.
 */
export const getChartSeriesColor = (index: number): string => {
  const safeIndex = ((index % SERIES_FALLBACKS.length) + SERIES_FALLBACKS.length) %
    SERIES_FALLBACKS.length;
  return resolveThemeToken(SERIES_TOKENS[safeIndex], SERIES_FALLBACKS[safeIndex]);
};
/*
 * Axis, grid, label and tooltip colours for chart chrome.
 */
export interface ChartChrome {
  axisLine: string;
  gridLine: string;
  labelText: string;
  titleText: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  primary: string;
  primaryContent: string;
}
export const getChartChrome = (): ChartChrome => ({
  axisLine: resolveThemeToken('--chart-axis-line'),
  gridLine: resolveThemeToken('--chart-grid-line'),
  labelText: resolveThemeToken('--chart-label-text'),
  titleText: resolveThemeToken('--chart-title-text'),
  tooltipBg: resolveThemeToken('--chart-tooltip-bg'),
  tooltipBorder: resolveThemeToken('--chart-tooltip-border'),
  tooltipText: resolveThemeToken('--chart-tooltip-text'),
  primary: resolveThemeToken('--color-primary'),
  primaryContent: resolveThemeToken('--color-primary-content'),
});
/*
 * Retained for existing call sites that index into a plain array. Prefer
 * `getChartSeriesColor` in new code so the value is theme-resolved.
 */
export const CHART_COLORS: readonly string[] = SERIES_FALLBACKS;
