'use server';
import { getDb, ensureTables } from '@/lib/db';
import { queryFIIDIIRange } from '@/lib/fiiDii/fiiDiiRepository';
import { getLatestEligibleFiiDiiDate } from '@/lib/fiiDii/fiiDiiFetcher';
import {
  processFIIDIIData,
  getTimeframeStartDate,
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
  const endDate = params.endDate
    ? (params.endDate > maxEligibleDate ? maxEligibleDate : params.endDate)
    : maxEligibleDate;
  const startDate = params.startDate || getTimeframeStartDate(timeframe, new Date(`${endDate}T12:00:00Z`));
  // Determine query strategy
  const isMultiYear = timeframe === 'ALL' || timeframe === 'MAX';
  const wantsDailyOrWeekly = interval === 'daily' || interval === 'weekly';
  const aggregation = params.aggregation || (isMultiYear && !wantsDailyOrWeekly ? 'monthly' : 'daily');
  const sql = getDb();
  await ensureTables(sql);
  const { flows, nifty, sensex, macros } = await queryFIIDIIRange(
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
    aggregation === 'monthly'
  );
  // If a specific interval was requested and not already monthly
  if (interval !== 'daily' && aggregation === 'daily') {
    const aggregatedPoints = aggregatePointsByInterval(processed.points, interval);
    return {
      ...processed,
      points: aggregatedPoints,
    };
  }
  // If aggregation was monthly and interval is quarterly, halfyearly, or yearly
  if (aggregation === 'monthly' && (interval === 'quarterly' || interval === 'halfyearly' || interval === 'yearly')) {
    const aggregatedPoints = aggregatePointsByInterval(processed.points, interval);
    return {
      ...processed,
      points: aggregatedPoints,
    };
  }
  return processed;
}
