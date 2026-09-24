import type { NavType } from '../../types/types';
import { addMonths, toISO } from '../../utilities/mutual-fund/mfDateHelpers';
import { navDateToISO, parseAnyDate } from '../../utilities/dateUtils';
import { resolveNav } from './navLookup';
import type { NavBook, StrategyConfig } from './types';
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
const MAX_WINDOW_YEARS = 10;
const MIN_SAMPLES = 12;
export interface RateBand {
  weak: number;
  median: number;
  strong: number;
  windowYears: number;
  samples: number;
  historyYears: number;
  degraded: boolean;
}
interface AscendingNav {
  iso: string;
  time: number;
  nav: number;
}
const ascendingNavs = (navData: NavType[]): AscendingNav[] =>
  navData
    .map((row) => {
      const iso = navDateToISO(row.date);
      return { iso, time: parseAnyDate(iso).getTime(), nav: Number(row.nav) };
    })
    .filter(({ time, nav }) => Number.isFinite(time) && Number.isFinite(nav) && nav > 0)
    .sort((a, b) => a.time - b.time);
const percentile = (sorted: number[], fraction: number): number => {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const rank = (sorted.length - 1) * fraction;
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (rank - low) * (sorted[high] - sorted[low]);
};
const annualised = (from: number, to: number, years: number): number =>
  from > 0 && to > 0 && years > 0 ? (to / from) ** (1 / years) - 1 : 0;
export const deriveRateBand = (navData: NavType[]): RateBand | null => {
  const points = ascendingNavs(navData);
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const historyYears = (last.time - first.time) / MS_PER_YEAR;
  if (historyYears <= 0) return null;
  const fullPeriod = annualised(first.nav, last.nav, historyYears);
  const collapsed = (windowYears: number, samples: number): RateBand => ({
    weak: fullPeriod,
    median: fullPeriod,
    strong: fullPeriod,
    windowYears,
    samples,
    historyYears,
    degraded: true,
  });
  const windowYears = Math.min(Math.max(Math.floor(historyYears / 2), 1), MAX_WINDOW_YEARS);
  if (historyYears < windowYears + 1) return collapsed(windowYears, 0);
  const cagrs: number[] = [];
  const startDate = parseAnyDate(first.iso);
  for (let month = 0; ; month += 1) {
    const from = addMonths(startDate, month);
    const to = addMonths(from, windowYears * 12);
    if (to.getTime() > last.time) break;
    const fromNav = resolveNav(navData, toISO(from));
    const toNav = resolveNav(navData, toISO(to));
    if (!fromNav || !toNav) continue;
    const rate = annualised(fromNav.nav, toNav.nav, windowYears);
    if (Number.isFinite(rate)) cagrs.push(rate);
  }
  if (cagrs.length < MIN_SAMPLES) return collapsed(windowYears, cagrs.length);
  cagrs.sort((a, b) => a - b);
  return {
    weak: percentile(cagrs, 0.1),
    median: percentile(cagrs, 0.5),
    strong: percentile(cagrs, 0.9),
    windowYears,
    samples: cagrs.length,
    historyYears,
    degraded: false,
  };
};
export const strategySchemes = (
  config: StrategyConfig
): { schemeCode: string; schemeName: string }[] => {
  const schemes: { schemeCode: string; schemeName: string }[] = [];
  const seen = new Set<string>();
  const push = (schemeCode: string, schemeName: string) => {
    if (seen.has(schemeCode)) return;
    seen.add(schemeCode);
    schemes.push({ schemeCode, schemeName });
  };
  if (config.column1.fund) push(config.column1.fund.schemeCode, config.column1.fund.schemeName);
  for (const entry of config.column2) push(entry.fund.schemeCode, entry.fund.schemeName);
  return schemes;
};
export const deriveRateBands = (
  config: StrategyConfig,
  navBook: NavBook
): Record<string, RateBand> => {
  const bands: Record<string, RateBand> = {};
  for (const scheme of strategySchemes(config)) {
    const band = deriveRateBand(navBook[scheme.schemeCode] ?? []);
    if (band) bands[scheme.schemeCode] = band;
  }
  return bands;
};
