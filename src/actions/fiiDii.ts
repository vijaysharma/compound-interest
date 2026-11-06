'use server';
import { getDb, ensureTables } from '@/lib/db';
import { redisGet, redisSet, redisDelPattern } from '@/lib/redis';
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
const fiiDiiMemoryCache = new Map<string, { data: FIIDIIDataResponse; expiresAt: number }>();
const FII_DII_MEM_TTL_MS = 15 * 60 * 1000; // 15 mins
const FII_DII_REDIS_TTL_SECONDS = 3600; // 1 hour
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
  const cacheKey = `fii_dii:${timeframe}:${interval}:${adjustmentMode}:${viewMode}:${aggregation}:${startDate || ''}:${endDate || ''}`;
  const memCached = fiiDiiMemoryCache.get(cacheKey);
  if (memCached && memCached.expiresAt > Date.now()) {
    const lastPoint = memCached.data.points?.[memCached.data.points.length - 1];
    if (!lastPoint || (lastPoint.niftyClose !== null && lastPoint.niftyClose !== undefined)) {
      return memCached.data;
    }
  }
  const redisCached = await redisGet<FIIDIIDataResponse>(cacheKey);
  if (redisCached && typeof redisCached === 'object' && redisCached.summary) {
    const lastPoint = redisCached.points?.[redisCached.points.length - 1];
    const isCachedIndexValid = lastPoint ? lastPoint.niftyClose !== null && lastPoint.niftyClose !== undefined : true;
    if (isCachedIndexValid) {
      fiiDiiMemoryCache.set(cacheKey, { data: redisCached, expiresAt: Date.now() + FII_DII_MEM_TTL_MS });
      return redisCached;
    }
  }
  const sql = getDb();
  await ensureTables(sql);
  // Auto-heal: Ensure both institutional flows and index prices are kept up-to-date
  try {
    const [latestFlowRows, latestNiftyRows] = (await Promise.all([
      sql`SELECT trade_date::text FROM institutional_flows ORDER BY trade_date DESC LIMIT 1`,
      sql`SELECT trade_date::text FROM index_prices WHERE index_name = 'NIFTY50' ORDER BY trade_date DESC LIMIT 1`,
    ])) as [Array<{ trade_date: string }>, Array<{ trade_date: string }>];
    const latestFlowDate = latestFlowRows[0]?.trade_date;
    const latestNiftyDate = latestNiftyRows[0]?.trade_date;
    let shouldInvalidate = false;
    // 1. Sync institutional flows if market closed and DB is behind
    if (latestFlowDate && latestFlowDate < maxEligibleDate) {
      try {
        const live = await fetchNSELiveFiiDii();
        if (live && live.tradeDate === maxEligibleDate) {
          await upsertInstitutionalFlow(sql, live);
          shouldInvalidate = true;
        }
      } catch (flowErr) {
        console.warn('[FII/DII] Auto-heal flow sync warning:', flowErr);
      }
    }
    // 2. Sync index prices independently (from Yahoo Finance) if lagging behind flows or eligible date
    const targetIndexDate = latestFlowDate && latestFlowDate > maxEligibleDate ? latestFlowDate : maxEligibleDate;
    if (!latestNiftyDate || latestNiftyDate < targetIndexDate) {
      try {
        const [niftyPrices, sensexPrices] = await Promise.all([
          fetchYahooIndexPrices('^NSEI', '5d'),
          fetchYahooIndexPrices('^BSESN', '5d'),
        ]);
        if (niftyPrices.length > 0 || sensexPrices.length > 0) {
          await Promise.all([
            upsertIndexPricesBatch(sql, 'NIFTY50', niftyPrices),
            upsertIndexPricesBatch(sql, 'SENSEX', sensexPrices),
          ]);
          shouldInvalidate = true;
        }
      } catch (indexErr) {
        console.warn('[FII/DII] Auto-heal index sync warning:', indexErr);
      }
    }
    if (shouldInvalidate) {
      fiiDiiMemoryCache.clear();
      await redisDelPattern('fii_dii:*').catch(() => {});
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
  let finalResult = withLatest;
  // If a specific interval was requested and not already monthly
  if (interval !== 'daily' && aggregation === 'daily') {
    const aggregatedPoints = aggregatePointsByInterval(processed.points, interval);
    finalResult = {
      ...withLatest,
      points: aggregatedPoints,
    };
  } else if (aggregation === 'monthly' && (interval === 'quarterly' || interval === 'halfyearly' || interval === 'yearly')) {
    // If aggregation was monthly and interval is quarterly, halfyearly, or yearly
    const aggregatedPoints = aggregatePointsByInterval(processed.points, interval);
    finalResult = {
      ...withLatest,
      points: aggregatedPoints,
    };
  }
  fiiDiiMemoryCache.set(cacheKey, { data: finalResult, expiresAt: Date.now() + FII_DII_MEM_TTL_MS });
  redisSet(cacheKey, finalResult, FII_DII_REDIS_TTL_SECONDS).catch(() => {});
  return finalResult;
}
