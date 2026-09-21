import type { NavType } from '../../types/types';
import { addMonths, toISO } from '../../utilities/mutual-fund/mfDateHelpers';
import { isoDateToNavDate, navDateToISO, parseAnyDate } from '../../utilities/dateUtils';
import { resolveNav } from './navLookup';
import { MONTHS_PER_INTERVAL, installmentDates, isOnOrBefore, stepUpFactor } from './schedule';
import { isZeroMoney, roundMoney } from './money';
import { nextId } from './defaults';
import type {
  Column2FundConfig,
  NavBook,
  StrategyConfig,
  StrategyResult,
  WithdrawalPeriod,
} from './types';
const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;
export const MIN_HORIZON_YEARS = 10;
export const MAX_HORIZON_YEARS = 100;
export const HORIZON_PRESETS = [10, 20, 30, 50, 100] as const;
/** Longest rolling window sampled, so a long history still yields many samples. */
const MAX_WINDOW_YEARS = 10;
/** Below this many rolling samples the percentiles mean nothing, so the band collapses. */
const MIN_SAMPLES = 12;
export type ScenarioKey = 'weak' | 'median' | 'strong';
export const SCENARIO_KEYS: ScenarioKey[] = ['weak', 'median', 'strong'];
export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  weak: 'Weak',
  median: 'Median',
  strong: 'Strong',
};
export const SCENARIO_BLURBS: Record<ScenarioKey, string> = {
  weak: '10th percentile of this fund’s own rolling windows — it did worse than this in 1 window out of 10',
  median: '50th percentile — the middle of everything this fund has actually done',
  strong: '90th percentile — it did better than this in only 1 window out of 10',
};
/**
 * The spread of annualised returns a fund has actually delivered, measured over
 * every rolling window in its own published history.
 *
 * A single realised CAGR hides the thing that decides whether a withdrawal plan
 * survives: the same fund at the same average return produces very different
 * outcomes depending on the run it happens to hit. Percentiles of its own
 * windows are the least speculative way to express that spread, and they are
 * robust to a bad data point in a way a min/max range would not be.
 */
export interface RateBand {
  weak: number;
  median: number;
  strong: number;
  /** Length of each sampled window, in years. */
  windowYears: number;
  samples: number;
  historyYears: number;
  /**
   * True when the history was too short to sample windows, so all three rates
   * collapse to the full-period CAGR. The band is then not a range at all.
   */
  degraded: boolean;
}
export interface ProjectionSettings {
  horizonYears: number;
  /**
   * Yearly increase applied to the withdrawal that continues past today. It is
   * the user's own escalation, not a return assumption — the rupee amount it
   * produces is still converted to units at the projected NAV.
   */
  annualIncreasePct: number;
}
export interface ScenarioOutcome {
  key: ScenarioKey;
  /** Annualised rate applied to each scheme, keyed by scheme code. */
  rates: Record<string, number>;
  result: StrategyResult;
  /** Personal-use money drawn after the as-of date. */
  futurePersonal: number;
  /** Portfolio value at the horizon. */
  terminalValue: number;
  /** Terminal value deflated by the annual increase, i.e. in today's rupees. */
  terminalValueToday: number;
  /** First instalment the portfolio could not pay in full, if any. */
  firstShortfallDate: string | null;
  /** First date the portfolio was worth nothing, if it got there. */
  exhaustedDate: string | null;
}
interface AscendingNav {
  iso: string;
  time: number;
  nav: number;
}
/** Published NAVs as usable numbers in date order, dropping unparseable rows. */
const ascendingNavs = (navData: NavType[]): AscendingNav[] =>
  navData
    .map((row) => {
      const iso = navDateToISO(row.date);
      return { iso, time: parseAnyDate(iso).getTime(), nav: Number(row.nav) };
    })
    .filter(
      ({ time, nav }) => Number.isFinite(time) && Number.isFinite(nav) && nav > 0
    )
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
/**
 * Rolling-window CAGRs for one fund, sampled monthly. The window is half the
 * available history, capped at ten years: long enough to span a cycle rather
 * than a rally, short enough to leave a useful number of samples.
 */
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
/** Every scheme the strategy touches, in the order the UI shows them. */
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
/**
 * The fund's published history with monthly synthetic NAVs appended, each one
 * the last real NAV compounded forward at `annualRate`.
 *
 * Every historical NAV is left exactly as published, so the part of the run
 * that overlaps the real timeline still matches the unprojected engine to the
 * paisa. Only dates past the fund's last published NAV are synthetic.
 */
export const extendNavHistory = (
  navData: NavType[],
  annualRate: number,
  horizonIso: string
): NavType[] => {
  const points = ascendingNavs(navData);
  const last = points[points.length - 1];
  if (!last) return navData;
  const horizonTime = parseAnyDate(horizonIso).getTime();
  if (!Number.isFinite(horizonTime) || horizonTime <= last.time) return navData;
  const growth = 1 + annualRate;
  if (growth <= 0) return navData;
  const from = parseAnyDate(last.iso);
  const synthetic: NavType[] = [];
  for (let month = 1; ; month += 1) {
    const date = addMonths(from, month);
    if (date.getTime() > horizonTime) break;
    const nav = last.nav * growth ** (month / 12);
    if (!Number.isFinite(nav) || nav <= 0) break;
    synthetic.push({ date: isoDateToNavDate(toISO(date)), nav: nav.toFixed(4) });
  }
  return synthetic.length > 0 ? [...navData, ...synthetic] : navData;
};
export const projectedNavBook = (
  config: StrategyConfig,
  navBook: NavBook,
  rates: Record<string, number>,
  horizonIso: string
): NavBook => {
  const projected: NavBook = { ...navBook };
  for (const scheme of strategySchemes(config)) {
    const navData = navBook[scheme.schemeCode];
    if (!navData || navData.length === 0) continue;
    const rate = rates[scheme.schemeCode];
    if (rate === undefined) continue;
    projected[scheme.schemeCode] = extendNavHistory(navData, rate, horizonIso);
  }
  return projected;
};
/** The withdrawal period still running at `asOfDate`, i.e. the standing instruction. */
const standingWithdrawal = (
  withdrawals: WithdrawalPeriod[],
  asOfDate: string
): WithdrawalPeriod | null => {
  const live = withdrawals.filter((period) => isOnOrBefore(asOfDate, period.endDate));
  if (live.length === 0) return null;
  return live.reduce((latest, period) =>
    isOnOrBefore(latest.endDate, period.endDate) ? period : latest
  );
};
/**
 * Carries the standing withdrawal instruction past its own end date.
 *
 * Rather than stretching the existing period, which would make its step-up
 * recompute over the historical instalments and silently change the past, this
 * appends a fresh period that starts on the instalment after the old one ends
 * and takes over at the amount the old one had escalated to.
 */
const continuationPeriod = (
  period: WithdrawalPeriod,
  horizonIso: string,
  annualIncreasePct: number
): WithdrawalPeriod | null => {
  const dates = installmentDates(period.startDate, period.endDate, period.frequency);
  if (dates.length === 0) return null;
  const lastDate = dates[dates.length - 1];
  const nextDate = toISO(
    addMonths(parseAnyDate(lastDate), MONTHS_PER_INTERVAL[period.frequency])
  );
  if (!isOnOrBefore(nextDate, horizonIso)) return null;
  const factor = stepUpFactor(dates.length - 1, period.frequency, period.annualStepUpPct);
  const amount = roundMoney(period.amount * factor);
  if (amount <= 0 || isZeroMoney(amount)) return null;
  return {
    id: nextId('wd-proj'),
    startDate: nextDate,
    endDate: horizonIso,
    frequency: period.frequency,
    amount,
    toColumn2: roundMoney(Math.min(period.toColumn2, period.amount) * factor),
    annualStepUpPct: annualIncreasePct,
  };
};
/** An SWP that has not already been switched off runs on to the horizon. */
const extendSwp = (entry: Column2FundConfig, asOfDate: string, horizonIso: string) =>
  entry.swp.enabled && isOnOrBefore(asOfDate, entry.swp.endDate)
    ? { ...entry, swp: { ...entry.swp, endDate: horizonIso } }
    : entry;
export const horizonDate = (asOfDate: string, horizonYears: number): string => {
  const base = parseAnyDate(asOfDate);
  if (!Number.isFinite(base.getTime())) return asOfDate;
  return toISO(addMonths(base, Math.round(horizonYears * 12)));
};
/**
 * The same configuration, valued at the horizon instead of today, with every
 * instruction that is still running carried forward to it.
 *
 * Nothing dated on or before the as-of date changes, so the historical part of
 * a projected run reproduces the unprojected run exactly.
 */
export const buildProjectedConfig = (
  config: StrategyConfig,
  settings: ProjectionSettings
): StrategyConfig => {
  const horizonIso = horizonDate(config.asOfDate, settings.horizonYears);
  const standing = standingWithdrawal(config.column1.withdrawals, config.asOfDate);
  const continuation = standing
    ? continuationPeriod(standing, horizonIso, settings.annualIncreasePct)
    : null;
  return {
    ...config,
    asOfDate: horizonIso,
    column1: {
      ...config.column1,
      withdrawals: continuation
        ? [...config.column1.withdrawals, continuation]
        : config.column1.withdrawals,
    },
    column2: config.column2.map((entry) => extendSwp(entry, config.asOfDate, horizonIso)),
  };
};
/** First instalment the portfolio could not pay in full. */
export const firstShortfall = (result: StrategyResult, afterDate: string): string | null => {
  for (const transaction of result.transactions) {
    if (transaction.kind !== 'c1-withdraw' && transaction.kind !== 'c2-swp') continue;
    if (isOnOrBefore(transaction.date, afterDate)) continue;
    if (transaction.settledAmount < transaction.amount - 0.005) return transaction.date;
  }
  return null;
};
/** First valuation date at which the whole portfolio was worth nothing. */
export const firstExhausted = (result: StrategyResult, afterDate: string): string | null => {
  for (const snapshot of result.snapshots) {
    if (isOnOrBefore(snapshot.date, afterDate)) continue;
    if (isZeroMoney(snapshot.totalValue)) return snapshot.date;
  }
  return null;
};
/** The band rate each scheme contributes to one scenario. */
export const scenarioRates = (
  bands: Record<string, RateBand>,
  key: ScenarioKey
): Record<string, number> =>
  Object.fromEntries(Object.entries(bands).map(([code, band]) => [code, band[key]]));
/** Reduces a long series to roughly `target` evenly spaced points, keeping the last. */
export const downsample = <T,>(rows: T[], target: number): T[] => {
  if (rows.length <= target) return rows;
  const stride = Math.ceil(rows.length / target);
  const sampled = rows.filter((_, index) => index % stride === 0);
  const last = rows[rows.length - 1];
  if (sampled[sampled.length - 1] !== last) sampled.push(last);
  return sampled;
};
/** Rupees at the horizon expressed in today's money, deflated at `annualPct`. */
export const inTodaysRupees = (value: number, annualPct: number, years: number): number => {
  if (annualPct <= 0 || years <= 0) return value;
  return roundMoney(value / (1 + annualPct / 100) ** years);
};
