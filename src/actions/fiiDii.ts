'use server';
import { getDb, ensureTables } from '@/lib/db';
import { queryFIIDIIRange } from '@/lib/fiiDii/fiiDiiRepository';
import {
  processFIIDIIData,
  getTimeframeStartDate,
  type AdjustmentMode,
  type ViewMode,
  type Timeframe,
  type FIIDIIDataResponse,
} from '@/lib/fiiDii/fiiDiiCalculations';
export interface GetFIIDIIDataParams {
  timeframe?: Timeframe;
  adjustmentMode?: AdjustmentMode;
  viewMode?: ViewMode;
  startDate?: string;
  endDate?: string;
}
export async function getFIIDIIDataAction(
  params: GetFIIDIIDataParams = {}
): Promise<FIIDIIDataResponse> {
  const timeframe = params.timeframe || '1Y';
  const adjustmentMode = params.adjustmentMode || 'nominal';
  const viewMode = params.viewMode || 'daily';
  const startDate = params.startDate || getTimeframeStartDate(timeframe);
  const endDate = params.endDate || new Date().toISOString().slice(0, 10);
  const sql = getDb();
  await ensureTables(sql);
  const { flows, nifty, sensex, macros } = await queryFIIDIIRange(sql, startDate, endDate);
  return processFIIDIIData(flows, nifty, sensex, macros, adjustmentMode, viewMode);
}
