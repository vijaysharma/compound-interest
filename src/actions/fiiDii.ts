'use server';
import { getDb, ensureTables } from '@/lib/db';
import {
  queryFIIDIIRange,
  upsertInstitutionalFlow,
  upsertIndexPricesBatch,
} from '@/lib/fiiDii/fiiDiiRepository';
import {
  getLatestEligibleFiiDiiDate,
  fetchNSELiveFiiDii,
  fetchYahooIndexPrices,
} from '@/lib/fiiDii/fiiDiiFetcher';
import {
  processFIIDIIData,
  getTimeframeStartDate,
  getFinancialYearRange,
  aggregatePointsByInterval,
  type AdjustmentMode,
  type ViewMode,
  type Timeframe,
  type FlowInterval,
  type FIIDIIDataResponse,
} from '@/lib/fiiDii/fiiDiiCalculations';
export interface GetFIIDIIDataParams {
  timeframe?: Timeframe;
  adjustmentMode?: AdjustmentMode;
  viewMode?: ViewMode;
  interval?: FlowInterval;
  startDate?: string;
  endDate?: string;
  aggregation?: 'daily' | 'monthly';
}
export async function getFIIDIIDataAction(
  params: GetFIIDIIDataParams = {}
): Promise<FIIDIIDataResponse> {
  const timeframe = params.timeframe || '1Y';
  const adjustmentMode = params.adjustmentMode || 'nominal';
  const viewMode = params.viewMode || 'daily';
  const interval: FlowInterval = params.interval || 'daily';
  // Enforce cutoff: today's data is only eligible after 6:00 PM IST (18:00 IST)
  const maxEligibleDate = getLatestEligibleFiiDiiDate();
  let endDate = params.endDate
    ? (params.endDate > maxEligibleDate ? maxEligibleDate : params.endDate)
    : maxEligibleDate;
  if (typeof timeframe === 'string' && timeframe.startsWith('FY')) {
    const fyEnd = getFinancialYearRange(timeframe).end;
    if (endDate > fyEnd) endDate = fyEnd;
  }
  let startDate = params.startDate;
  if (!startDate) {
    if (typeof timeframe === 'string' && timeframe.startsWith('FY')) {
      startDate = getFinancialYearRange(timeframe).start;
    } else {
      startDate = getTimeframeStartDate(timeframe, new Date(`${endDate}T12:00:00Z`));
    }
  }
  // Determine query strategy
  const isMultiYear = timeframe === 'ALL' || timeframe === 'MAX';
  const wantsDailyOrWeekly = interval === 'daily' || interval === 'weekly';
  const aggregation = params.aggregation || (isMultiYear && !wantsDailyOrWeekly ? 'monthly' : 'daily');
  const sql = getDb();
  await ensureTables(sql);
  // Auto-heal: If today's market has published data (>18:00 IST) and DB doesn't have it yet, sync now
  try {
    const latestDbRow = (await sql`
      SELECT trade_date::text FROM institutional_flows ORDER BY trade_date DESC LIMIT 1
    `) as Array<{ trade_date: string }>;
    const latestDbDate = latestDbRow[0]?.trade_date;
    if (latestDbDate && latestDbDate < maxEligibleDate) {
      const live = await fetchNSELiveFiiDii();
      if (live && live.tradeDate === maxEligibleDate) {
        await upsertInstitutionalFlow(sql, live);
        const [niftyPrices, sensexPrices] = await Promise.all([
          fetchYahooIndexPrices('^NSEI', '5d'),
          fetchYahooIndexPrices('^BSESN', '5d'),
        ]);
        const validNifty = niftyPrices.filter((p) => p.tradeDate <= maxEligibleDate);
        const validSensex = sensexPrices.filter((p) => p.tradeDate <= maxEligibleDate);
        await Promise.all([
          upsertIndexPricesBatch(sql, 'NIFTY50', validNifty),
          upsertIndexPricesBatch(sql, 'SENSEX', validSensex),
        ]);
      }
    }
  } catch (err) {
    console.warn('[FII/DII] Auto-heal sync error:', err);
  }
  const { flows, nifty, sensex, macros, actualLatestDate, latestDailyFlow } = await queryFIIDIIRange(
    sql,
    startDate,
    endDate,
    aggregation
  );
  const processed = processFIIDIIData(
    flows,
    nifty,
    sensex,
    macros,
    adjustmentMode,
    viewMode,
    aggregation === 'monthly',
    latestDailyFlow
  );
  const withLatest = { ...processed, actualLatestDate };
  // If a specific interval was requested and not already monthly
  if (interval !== 'daily' && aggregation === 'daily') {
    const aggregatedPoints = aggregatePointsByInterval(processed.points, interval);
    return {
      ...withLatest,
      points: aggregatedPoints,
    };
  }
  // If aggregation was monthly and interval is quarterly, halfyearly, or yearly
  if (aggregation === 'monthly' && (interval === 'quarterly' || interval === 'halfyearly' || interval === 'yearly')) {
    const aggregatedPoints = aggregatePointsByInterval(processed.points, interval);
    return {
      ...withLatest,
      points: aggregatedPoints,
    };
  }
  return withLatest;
}
