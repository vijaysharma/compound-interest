import type { DbInstitutionalFlow, DbIndexPrice, DbMacroIndicator } from '@/lib/db';
export type AdjustmentMode = 'nominal' | 'inflation' | 'ppp';
export type ViewMode = 'daily' | 'cumulative';
export type Timeframe = '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL' | 'MAX' | `FY${number}`;
export type FlowInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
export const FLOW_INTERVALS: { key: FlowInterval; label: string }[] = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'halfyearly', label: 'Half-Yearly' },
  { key: 'yearly', label: 'Yearly' },
];
export interface ProcessedFIIDIIPoint {
  tradeDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "12 Jun '24" or "Jun '24"
  fiiBuy: number;
  fiiSell: number;
  fiiNet: number;
  diiBuy: number;
  diiSell: number;
  diiNet: number;
  nominalFiiNet: number;
  nominalDiiNet: number;
  cumulativeFiiNet: number;
  cumulativeDiiNet: number;
  niftyClose?: number | null;
  sensexClose?: number | null;
  cpi?: number;
  ppp?: number;
}
export interface FIIDIISummary {
  latestDate: string;
  periodStart: string;
  periodEnd: string;
  latestFiiNet: number;
  latestDiiNet: number;
  totalFiiNet: number;
  totalDiiNet: number;
  totalPeriodDays: number;
  latestNifty: number | null;
  niftyPeriodChangePercent: number | null;
  latestSensex: number | null;
  sensexPeriodChangePercent: number | null;
  cpiLatest: number;
  pppLatest: number;
  adjustmentMode: AdjustmentMode;
  viewMode: ViewMode;
}
export interface FIIDIIDataResponse {
  points: ProcessedFIIDIIPoint[];
  summary: FIIDIISummary;
  isMonthly?: boolean;
}
/**
 * Formats YYYY-MM-DD into readable short date (e.g. "14 Oct '23" or "Oct '23")
 */
export function formatShortDate(dateStr: string, isMonthly = false): string {
  const [y, m, d] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(m, 10) - 1;
  const shortYear = y ? y.slice(2) : '';
  if (isMonthly) {
    return `${monthNames[monthIdx] || m} '${shortYear}`;
  }
  return `${parseInt(d, 10)} ${monthNames[monthIdx] || m} '${shortYear}`;
}
/**
 * Finds the applicable CPI and PPP for a given trade date.
 */
function findMacroFactors(
  tradeDate: string,
  macros: DbMacroIndicator[]
): { cpi: number; ppp: number } {
  if (macros.length === 0) {
    return { cpi: 233.0, ppp: 23.85 };
  }
  // Find latest macro record with record_date <= tradeDate
  let match = macros[0];
  for (const m of macros) {
    if (m.record_date <= tradeDate) {
      match = m;
    } else {
      break;
    }
  }
  const cpi = Number(match.cpi_index) || 233.0;
  const ppp = Number(match.ppp_factor) || 23.85;
  return { cpi, ppp };
}
/**
 * Transforms raw flows, prices, and macros into display-ready series.
 */
export function processFIIDIIData(
  flows: DbInstitutionalFlow[],
  nifty: DbIndexPrice[],
  sensex: DbIndexPrice[],
  macros: DbMacroIndicator[],
  adjustmentMode: AdjustmentMode,
  viewMode: ViewMode,
  isMonthly = false
): FIIDIIDataResponse {
  // Sort macros by record_date
  const sortedMacros = [...macros].sort((a, b) => a.record_date.localeCompare(b.record_date));
  const latestMacro = sortedMacros[sortedMacros.length - 1];
  const cpiLatest = latestMacro ? Number(latestMacro.cpi_index) || 233.0 : 233.0;
  const pppLatest = latestMacro ? Number(latestMacro.ppp_factor) || 23.85 : 23.85;
  // Build index lookup maps
  const niftyMap = new Map<string, number>();
  for (const p of nifty) {
    niftyMap.set(p.trade_date, Number(p.close_price));
  }
  const sensexMap = new Map<string, number>();
  for (const p of sensex) {
    sensexMap.set(p.trade_date, Number(p.close_price));
  }
  let runningFiiNet = 0;
  let runningDiiNet = 0;
  const points: ProcessedFIIDIIPoint[] = [];
  for (const row of flows) {
    const tradeDate = row.trade_date;
    const fiiBuy = Number(row.fii_buy_crores);
    const fiiSell = Number(row.fii_sell_crores);
    const nominalFiiNet = Number(row.fii_net_crores) || fiiBuy - fiiSell;
    const diiBuy = Number(row.dii_buy_crores);
    const diiSell = Number(row.dii_sell_crores);
    const nominalDiiNet = Number(row.dii_net_crores) || diiBuy - diiSell;
    const { cpi, ppp } = findMacroFactors(tradeDate, sortedMacros);
    let displayFiiNet = nominalFiiNet;
    let displayDiiNet = nominalDiiNet;
    if (adjustmentMode === 'inflation') {
      const ratio = cpi > 0 ? cpiLatest / cpi : 1.0;
      displayFiiNet = Math.round(nominalFiiNet * ratio * 100) / 100;
      displayDiiNet = Math.round(nominalDiiNet * ratio * 100) / 100;
    } else if (adjustmentMode === 'ppp') {
      const divisor = ppp > 0 ? ppp : 1.0;
      displayFiiNet = Math.round((nominalFiiNet / divisor) * 100) / 100;
      displayDiiNet = Math.round((nominalDiiNet / divisor) * 100) / 100;
    }
    runningFiiNet += displayFiiNet;
    runningDiiNet += displayDiiNet;
    points.push({
      tradeDate,
      formattedDate: formatShortDate(tradeDate, isMonthly),
      fiiBuy,
      fiiSell,
      fiiNet: displayFiiNet,
      diiBuy,
      diiSell,
      diiNet: displayDiiNet,
      nominalFiiNet,
      nominalDiiNet,
      cumulativeFiiNet: Math.round(runningFiiNet * 100) / 100,
      cumulativeDiiNet: Math.round(runningDiiNet * 100) / 100,
      niftyClose: niftyMap.get(tradeDate) ?? null,
      sensexClose: sensexMap.get(tradeDate) ?? null,
      cpi,
      ppp,
    });
  }
  // Summary calculation
  const totalPeriodDays = points.length;
  const latestPoint = points[points.length - 1];
  const latestDate = latestPoint ? latestPoint.tradeDate : '';
  const periodStart = points.length > 0 ? points[0].tradeDate : '';
  const periodEnd = latestDate;
  const latestFiiNet = latestPoint ? latestPoint.fiiNet : 0;
  const latestDiiNet = latestPoint ? latestPoint.diiNet : 0;
  const totalFiiNet = Math.round(runningFiiNet * 100) / 100;
  const totalDiiNet = Math.round(runningDiiNet * 100) / 100;
  let latestNifty: number | null = null;
  let niftyPeriodChangePercent: number | null = null;
  const niftyPoints = points.filter((p) => p.niftyClose !== null && p.niftyClose !== undefined);
  if (niftyPoints.length > 0) {
    const firstN = niftyPoints[0].niftyClose!;
    const lastN = niftyPoints[niftyPoints.length - 1].niftyClose!;
    latestNifty = lastN;
    if (firstN > 0) {
      niftyPeriodChangePercent = Math.round(((lastN - firstN) / firstN) * 10000) / 100;
    }
  }
  let latestSensex: number | null = null;
  let sensexPeriodChangePercent: number | null = null;
  const sensexPoints = points.filter((p) => p.sensexClose !== null && p.sensexClose !== undefined);
  if (sensexPoints.length > 0) {
    const firstS = sensexPoints[0].sensexClose!;
    const lastS = sensexPoints[sensexPoints.length - 1].sensexClose!;
    latestSensex = lastS;
    if (firstS > 0) {
      sensexPeriodChangePercent = Math.round(((lastS - firstS) / firstS) * 10000) / 100;
    }
  }
  return {
    points,
    summary: {
      latestDate,
      periodStart,
      periodEnd,
      latestFiiNet,
      latestDiiNet,
      totalFiiNet,
      totalDiiNet,
      totalPeriodDays,
      latestNifty,
      niftyPeriodChangePercent,
      latestSensex,
      sensexPeriodChangePercent,
      cpiLatest,
      pppLatest,
      adjustmentMode,
      viewMode,
    },
    isMonthly,
  };
}
/**
 * Instant client-side recalculation without network fetches.
 */
export function adjustFIIDIIPoints(
  basePoints: ProcessedFIIDIIPoint[],
  cpiLatest: number,
  pppLatest: number,
  adjustmentMode: AdjustmentMode,
  viewMode: ViewMode
): { points: ProcessedFIIDIIPoint[]; summary: FIIDIISummary } {
  let runningFiiNet = 0;
  let runningDiiNet = 0;
  const points: ProcessedFIIDIIPoint[] = [];
  for (const p of basePoints) {
    const nominalFii = p.nominalFiiNet ?? p.fiiNet;
    const nominalDii = p.nominalDiiNet ?? p.diiNet;
    const cpi = p.cpi ?? cpiLatest;
    const ppp = p.ppp ?? pppLatest;
    let displayFii = nominalFii;
    let displayDii = nominalDii;
    if (adjustmentMode === 'inflation') {
      const ratio = cpi > 0 ? cpiLatest / cpi : 1.0;
      displayFii = Math.round(nominalFii * ratio * 100) / 100;
      displayDii = Math.round(nominalDii * ratio * 100) / 100;
    } else if (adjustmentMode === 'ppp') {
      const divisor = ppp > 0 ? ppp : 1.0;
      displayFii = Math.round((nominalFii / divisor) * 100) / 100;
      displayDii = Math.round((nominalDii / divisor) * 100) / 100;
    }
    runningFiiNet += displayFii;
    runningDiiNet += displayDii;
    points.push({
      ...p,
      fiiNet: displayFii,
      diiNet: displayDii,
      cumulativeFiiNet: Math.round(runningFiiNet * 100) / 100,
      cumulativeDiiNet: Math.round(runningDiiNet * 100) / 100,
    });
  }
  const latestPoint = points[points.length - 1];
  const niftyPoints = points.filter((pt) => pt.niftyClose !== null && pt.niftyClose !== undefined);
  let latestNifty: number | null = null;
  let niftyPeriodChangePercent: number | null = null;
  if (niftyPoints.length > 0) {
    const firstN = niftyPoints[0].niftyClose!;
    const lastN = niftyPoints[niftyPoints.length - 1].niftyClose!;
    latestNifty = lastN;
    if (firstN > 0) {
      niftyPeriodChangePercent = Math.round(((lastN - firstN) / firstN) * 10000) / 100;
    }
  }
  const sensexPoints = points.filter((pt) => pt.sensexClose !== null && pt.sensexClose !== undefined);
  let latestSensex: number | null = null;
  let sensexPeriodChangePercent: number | null = null;
  if (sensexPoints.length > 0) {
    const firstS = sensexPoints[0].sensexClose!;
    const lastS = sensexPoints[sensexPoints.length - 1].sensexClose!;
    latestSensex = lastS;
    if (firstS > 0) {
      sensexPeriodChangePercent = Math.round(((lastS - firstS) / firstS) * 10000) / 100;
    }
  }
  return {
    points,
    summary: {
      latestDate: latestPoint ? latestPoint.tradeDate : '',
      periodStart: points.length > 0 ? points[0].tradeDate : '',
      periodEnd: latestPoint ? latestPoint.tradeDate : '',
      latestFiiNet: latestPoint ? latestPoint.fiiNet : 0,
      latestDiiNet: latestPoint ? latestPoint.diiNet : 0,
      totalFiiNet: Math.round(runningFiiNet * 100) / 100,
      totalDiiNet: Math.round(runningDiiNet * 100) / 100,
      totalPeriodDays: points.length,
      latestNifty,
      niftyPeriodChangePercent,
      latestSensex,
      sensexPeriodChangePercent,
      cpiLatest,
      pppLatest,
      adjustmentMode,
      viewMode,
    },
  };
}
/**
 * Returns { start, end } for an Indian Financial Year string like "FY2024" (Apr 2023 – Mar 2024).
 * FY2024 = 1 Apr 2023 to 31 Mar 2024.
 */
export function getFinancialYearRange(fy: string): { start: string; end: string } {
  const year = parseInt(fy.replace('FY', ''), 10);
  return {
    start: `${year - 1}-04-01`,
    end: `${year}-03-31`,
  };
}
/**
 * Calculates start date string based on timeframe selection.
 */
export function getTimeframeStartDate(timeframe: Timeframe, baseDate = new Date()): string {
  const d = new Date(baseDate.getTime());
  switch (timeframe) {
    case '1M':
      d.setMonth(d.getMonth() - 1);
      break;
    case '3M':
      d.setMonth(d.getMonth() - 3);
      break;
    case '6M':
      d.setMonth(d.getMonth() - 6);
      break;
    case '1Y':
      d.setFullYear(d.getFullYear() - 1);
      break;
    case '5Y':
      d.setFullYear(d.getFullYear() - 5);
      break;
    case 'ALL':
    case 'MAX':
      return '2007-01-01';
    default:
      if (typeof timeframe === 'string' && timeframe.startsWith('FY')) {
        return getFinancialYearRange(timeframe).start;
      }
  }
  return d.toISOString().slice(0, 10);
}
/**
 * Aggregates daily ProcessedFIIDIIPoint records into a specified time interval:
 * - Flows (fiiBuy, fiiSell, fiiNet, diiBuy, diiSell, diiNet, etc.) are summed over the bucket.
 * - Indices (niftyClose, sensexClose) take the closing price of the final trading day in the bucket.
 * - Macro indicators (cpi, ppp) take the values of the final trading day in the bucket.
 * - Cumulative values are recalculated sequentially across the aggregated buckets.
 */
export function aggregatePointsByInterval(
  points: ProcessedFIIDIIPoint[],
  interval: FlowInterval
): ProcessedFIIDIIPoint[] {
  if (interval === 'daily' || points.length === 0) {
    return points;
  }
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const getBucketKey = (dateStr: string): { key: string; label: string } => {
    const [yStr, mStr] = dateStr.split('-');
    const month = parseInt(mStr, 10);
    const shortYear = yStr.slice(2);
    switch (interval) {
      case 'weekly': {
        const d = new Date(`${dateStr}T12:00:00Z`);
        const dayOfWeek = d.getUTCDay();
        const diffToFriday = 5 - dayOfWeek;
        const weekEnd = new Date(d.getTime() + diffToFriday * 86400000);
        const endStr = weekEnd.toISOString().slice(0, 10);
        const [, em, ed] = endStr.split('-');
        const endMonthName = monthNames[parseInt(em, 10) - 1];
        return {
          key: `W_${endStr}`,
          label: `${parseInt(ed, 10)} ${endMonthName} '${weekEnd.getUTCFullYear().toString().slice(2)}`,
        };
      }
      case 'monthly': {
        return {
          key: `${yStr}-${mStr}`,
          label: `${monthNames[month - 1]} '${shortYear}`,
        };
      }
      case 'quarterly': {
        const q = Math.ceil(month / 3);
        return {
          key: `${yStr}-Q${q}`,
          label: `Q${q} '${shortYear}`,
        };
      }
      case 'halfyearly': {
        const h = month <= 6 ? 1 : 2;
        return {
          key: `${yStr}-H${h}`,
          label: `H${h} '${shortYear}`,
        };
      }
      case 'yearly': {
        return {
          key: yStr,
          label: yStr,
        };
      }
      default:
        return { key: dateStr, label: dateStr };
    }
  };
  const buckets = new Map<string, {
    key: string;
    label: string;
    tradeDate: string;
    fiiBuy: number;
    fiiSell: number;
    fiiNet: number;
    diiBuy: number;
    diiSell: number;
    diiNet: number;
    nominalFiiNet: number;
    nominalDiiNet: number;
    niftyClose: number | null;
    sensexClose: number | null;
    cpi: number;
    ppp: number;
  }>();
  for (const pt of points) {
    const { key, label } = getBucketKey(pt.tradeDate);
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        key,
        label,
        tradeDate: pt.tradeDate,
        fiiBuy: pt.fiiBuy,
        fiiSell: pt.fiiSell,
        fiiNet: pt.fiiNet,
        diiBuy: pt.diiBuy,
        diiSell: pt.diiSell,
        diiNet: pt.diiNet,
        nominalFiiNet: pt.nominalFiiNet,
        nominalDiiNet: pt.nominalDiiNet,
        niftyClose: pt.niftyClose ?? null,
        sensexClose: pt.sensexClose ?? null,
        cpi: pt.cpi ?? 233,
        ppp: pt.ppp ?? 23.85,
      });
    } else {
      existing.fiiBuy = Math.round((existing.fiiBuy + pt.fiiBuy) * 100) / 100;
      existing.fiiSell = Math.round((existing.fiiSell + pt.fiiSell) * 100) / 100;
      existing.fiiNet = Math.round((existing.fiiNet + pt.fiiNet) * 100) / 100;
      existing.diiBuy = Math.round((existing.diiBuy + pt.diiBuy) * 100) / 100;
      existing.diiSell = Math.round((existing.diiSell + pt.diiSell) * 100) / 100;
      existing.diiNet = Math.round((existing.diiNet + pt.diiNet) * 100) / 100;
      existing.nominalFiiNet = Math.round((existing.nominalFiiNet + pt.nominalFiiNet) * 100) / 100;
      existing.nominalDiiNet = Math.round((existing.nominalDiiNet + pt.nominalDiiNet) * 100) / 100;
      if (pt.niftyClose !== null && pt.niftyClose !== undefined) {
        existing.niftyClose = pt.niftyClose;
      }
      if (pt.sensexClose !== null && pt.sensexClose !== undefined) {
        existing.sensexClose = pt.sensexClose;
      }
      existing.tradeDate = pt.tradeDate;
      existing.cpi = pt.cpi ?? existing.cpi;
      existing.ppp = pt.ppp ?? existing.ppp;
    }
  }
  let runningFii = 0;
  let runningDii = 0;
  const result: ProcessedFIIDIIPoint[] = [];
  for (const b of buckets.values()) {
    runningFii += b.fiiNet;
    runningDii += b.diiNet;
    result.push({
      tradeDate: b.tradeDate,
      formattedDate: b.label,
      fiiBuy: b.fiiBuy,
      fiiSell: b.fiiSell,
      fiiNet: b.fiiNet,
      diiBuy: b.diiBuy,
      diiSell: b.diiSell,
      diiNet: b.diiNet,
      nominalFiiNet: b.nominalFiiNet,
      nominalDiiNet: b.nominalDiiNet,
      cumulativeFiiNet: Math.round(runningFii * 100) / 100,
      cumulativeDiiNet: Math.round(runningDii * 100) / 100,
      niftyClose: b.niftyClose,
      sensexClose: b.sensexClose,
      cpi: b.cpi,
      ppp: b.ppp,
    });
  }
  return result;
}
