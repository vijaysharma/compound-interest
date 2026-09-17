'use client';
import { useSyncExternalStore } from 'react';
import { getChartChrome, type ChartChrome } from '@/data/chartColors';
/*
 * Charts draw to a canvas and therefore need concrete colours rather than
 * `var(--token)` references. This hook resolves the chart chrome tokens from the
 * document and re-resolves them whenever the active theme changes, so axis
 * lines, grid lines, labels and tooltips track light/dark without the chart
 * having to be remounted.
 *
 * It also reports whether the viewport is in the mobile range, which callers use
 * to shrink label fonts and thin out ticks so charts stay legible down to 320px.
 *
 * Both values are read through `useSyncExternalStore` because they live in the
 * DOM rather than in React state; the snapshot is cached so the store returns a
 * stable reference between notifications.
 */
const MOBILE_QUERY = '(max-width: 639px)';
export interface ChartTheme extends ChartChrome {
  isMobile: boolean;
}
/*
 * Server snapshot: SSR has no document, so fall back to the light-theme values
 * and the desktop layout.
 */
const SERVER_SNAPSHOT: ChartTheme = { ...getChartChrome(), isMobile: false };
let cachedSnapshot: ChartTheme | null = null;
const readSnapshot = (): ChartTheme => {
  const next: ChartTheme = {
    ...getChartChrome(),
    isMobile: window.matchMedia(MOBILE_QUERY).matches,
  };
  // Returning a new object on every call would loop the store, so only swap the
  // cached snapshot when a value actually changed.
  if (
    cachedSnapshot &&
    (Object.keys(next) as (keyof ChartTheme)[]).every((k) => cachedSnapshot![k] === next[k])
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  return next;
};
const subscribe = (onChange: () => void): (() => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class', 'style'],
  });
  const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const mobile = window.matchMedia(MOBILE_QUERY);
  colorScheme.addEventListener('change', onChange);
  mobile.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    colorScheme.removeEventListener('change', onChange);
    mobile.removeEventListener('change', onChange);
  };
};
export const useChartTheme = (): ChartTheme =>
  useSyncExternalStore(subscribe, readSnapshot, () => SERVER_SNAPSHOT);
