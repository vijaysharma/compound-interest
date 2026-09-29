import type { DbInstitutionalFlow, DbIndexPrice, DbMacroIndicator } from '@/lib/db';
export type AdjustmentMode = 'nominal' | 'inflation' | 'ppp';
export type ViewMode = 'daily' | 'cumulative';
export type Timeframe = '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL' | 'MAX';
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
  }
  return d.toISOString().slice(0, 10);
}
