import type { NavType } from '../../types/types';
import { addMonths, toISO } from '../../utilities/mutual-fund/mfDateHelpers';
import { isoDateToNavDate, navDateToISO, parseAnyDate } from '../../utilities/dateUtils';
import type { NavBook, StrategyConfig } from './types';
import { RISK_PROFILES, type ScenarioKey } from './projectionProfiles';
import { strategySchemes, type RateBand } from './projectionRates';
export interface ExtendNavOptions {
  scenarioKey?: ScenarioKey;
  cyclical?: boolean;
}
export const historicalMaxDrawdown = (navData: NavType[], fallbackRate?: number): number => {
  const points = navData
    .map((row) => ({ iso: navDateToISO(row.date), nav: Number(row.nav) }))
    .filter(({ nav }) => Number.isFinite(nav) && nav > 0);
  if (points.length < 12) {
    return (fallbackRate ?? 0.12) > 0.085 ? 0.30 : 0.02;
  }
  let peak = points[0].nav;
  let maxDd = 0;
  for (const pt of points) {
    if (pt.nav > peak) {
      peak = pt.nav;
    } else if (peak > 0) {
      const dd = (peak - pt.nav) / peak;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
};
export const calibrateForwardRate = (historicalRate: number, key: ScenarioKey): number => {
  if (!Number.isFinite(historicalRate) || historicalRate <= 0) return 0;
  const profile = RISK_PROFILES[key] ?? RISK_PROFILES.median;
  const benchmark = profile.benchmarkCagr;
  if (historicalRate <= 0.085) return historicalRate;
  if (key === 'weak') {
    return Math.min(0.095, Math.max(0.080, benchmark + (historicalRate - 0.12) * 0.1));
  }
  if (key === 'median') {
    return Math.min(0.130, Math.max(0.110, benchmark + (historicalRate - 0.15) * 0.15));
  }
  return Math.min(0.160, Math.max(0.140, benchmark + (historicalRate - 0.18) * 0.15));
};
export const extendNavHistory = (
  navData: NavType[],
  annualRate: number,
  horizonIso: string,
  options?: ExtendNavOptions | ScenarioKey
): NavType[] => {
  const points = navData
    .map((row) => ({ iso: navDateToISO(row.date), time: parseAnyDate(navDateToISO(row.date)).getTime(), nav: Number(row.nav) }))
    .filter(({ time, nav }) => Number.isFinite(time) && Number.isFinite(nav) && nav > 0)
    .sort((a, b) => a.time - b.time);
  const last = points[points.length - 1];
  if (!last) return navData;
  const horizonTime = parseAnyDate(horizonIso).getTime();
  if (!Number.isFinite(horizonTime) || horizonTime <= last.time || annualRate <= -1) return navData;
  const from = parseAnyDate(last.iso);
  const synthetic: NavType[] = [];
  const opts: ExtendNavOptions = typeof options === 'string' ? { scenarioKey: options } : (options ?? {});
  const scenarioKey = opts.scenarioKey ?? 'median';
  const cyclical = opts.cyclical !== false;
  const profile = RISK_PROFILES[scenarioKey] ?? RISK_PROFILES.median;
  const T = profile.cycleYears;
  const mdd = historicalMaxDrawdown(navData, annualRate);
  const D = mdd <= 0.04 ? Math.min(mdd, 0.025) : mdd <= 0.15 ? Math.min(mdd, profile.drawdownMax * 0.65) : profile.drawdownMax;
  for (let month = 1; ; month += 1) {
    const date = addMonths(from, month);
    if (date.getTime() > horizonTime) break;
    const t = month / 12;
    const decay = t <= 20 ? 0 : Math.min(0.5, (t - 20) / 60);
    const rEff = annualRate * (1 - decay) + 0.095 * decay;
    const trend = (1 + rEff) ** t;
    let nav = last.nav * trend;
    if (cyclical && D > 0.005) {
      const cycle1 = Math.sin((2 * Math.PI * t) / T) - 0.45 * Math.sin((Math.PI * t) / T) ** 2;
      const cycle2 = 0.25 * Math.sin((2 * Math.PI * t) / 1.6);
      const cycle = D * (cycle1 + cycle2);
      const damp = t < 0.5 ? t / 0.5 : 1;
      nav *= 1 + cycle * damp;
    }
    if (!Number.isFinite(nav) || nav <= 0) break;
    synthetic.push({ date: isoDateToNavDate(toISO(date)), nav: nav.toFixed(4) });
  }
  return synthetic.length > 0 ? [...navData, ...synthetic] : navData;
};
export const projectedHorizonShortfall = (
  navBook: NavBook,
  schemeCode: string,
  horizonIso: string
): string | null => {
  const rows = navBook[schemeCode];
  if (!rows || rows.length === 0) return null;
  const lastIso = navDateToISO(rows[rows.length - 1].date);
  return lastIso && lastIso < horizonIso ? lastIso : null;
};
export const scenarioRates = (
  bands: Record<string, RateBand>,
  key: ScenarioKey
): Record<string, number> => {
  const rates: Record<string, number> = {};
  for (const [code, band] of Object.entries(bands)) {
    rates[code] = calibrateForwardRate(band[key], key);
  }
  return rates;
};
export const projectedNavBook = (
  config: StrategyConfig,
  navBook: NavBook,
  rates: Record<string, number>,
  horizonIso: string,
  scenarioKey: ScenarioKey = 'median'
): NavBook => {
  const projected: NavBook = { ...navBook };
  for (const scheme of strategySchemes(config)) {
    const navData = navBook[scheme.schemeCode];
    if (!navData || navData.length === 0) continue;
    const rate = rates[scheme.schemeCode];
    if (rate === undefined) continue;
    projected[scheme.schemeCode] = extendNavHistory(navData, rate, horizonIso, {
      scenarioKey,
      cyclical: true,
    });
  }
  return projected;
};
