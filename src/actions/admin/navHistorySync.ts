'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import { redisGet, redisSet } from '@/lib/redis';
import { formatAmfiDate } from '@/lib/amfi/amfiDate';
import { fetchAmfiHistoricalChunk } from '@/lib/amfi/amfiClient';
import { bulkUpsertAmfiSchemes } from '@/lib/amfi/amfiBulkStorage';
import { calculateNext90DayWindow, validate90DayInterval } from './navHistoryDates';
import type { NavHistoryCheckpoint, NavHistorySyncOptions, NavHistorySyncReport } from './navHistoryTypes';
const CHECKPOINT_KEY = 'nav:history:sync:checkpoint';
const CHECKPOINT_TTL = 30 * 24 * 60 * 60;
export async function getNavHistorySyncStatusAction(token?: string | null): Promise<NavHistoryCheckpoint | null> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) throw new Error('Unauthorized');
  return redisGet<NavHistoryCheckpoint>(CHECKPOINT_KEY);
}
export async function syncNavHistoryAction(
  token: string | null | undefined,
  options: NavHistorySyncOptions
): Promise<NavHistorySyncReport> {
  const startedAt = Date.now();
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) throw new Error('Unauthorized: Admin access required');
  const validation = validate90DayInterval(options.fromDate, options.toDate);
  if (!validation.isValid) throw new Error(validation.error ?? 'Invalid date range');
  const fromAmfi = formatAmfiDate(options.fromDate);
  const toAmfi = formatAmfiDate(options.toDate);
  const parsed = await fetchAmfiHistoricalChunk(fromAmfi, toAmfi, undefined, 60_000);
  const requestedCodes = (options.schemeCodes ?? []).map((c) => String(c).trim()).filter((c) => /^\d{1,10}$/.test(c));
  if (requestedCodes.length > 0) {
    const codeSet = new Set(requestedCodes);
    for (const code of Array.from(parsed.byScheme.keys())) {
      if (!codeSet.has(code)) {
        parsed.byScheme.delete(code);
        parsed.schemes.delete(code);
      }
    }
  }
  const bulkResult = await bulkUpsertAmfiSchemes(parsed, 300, 35_000);
  const nextWindow = calculateNext90DayWindow(options.fromDate);
  const nextFromAmfi = formatAmfiDate(nextWindow.nextFrom);
  const nextToAmfi = formatAmfiDate(nextWindow.nextTo);
  const checkpoint: NavHistoryCheckpoint = {
    lastSyncedFrom: options.fromDate,
    lastSyncedTo: options.toDate,
    nextFrom: nextWindow.nextFrom,
    nextTo: nextWindow.nextTo,
    recordsStored: parsed.records.length,
    schemesUpdated: bulkResult.totalUpserted,
    syncedAt: Date.now(),
  };
  await redisSet(CHECKPOINT_KEY, checkpoint, CHECKPOINT_TTL).catch(() => {});
  const sampleSchemes = Array.from(parsed.byScheme.entries())
    .slice(0, 5)
    .map(([code, rows]) => ({
      schemeCode: code,
      schemeName: parsed.schemes.get(code)?.schemeName,
      rowsAdded: rows.length,
    }));
  return {
    fromDate: options.fromDate,
    toDate: options.toDate,
    fromAmfi,
    toAmfi,
    totalRecords: parsed.records.length,
    totalSchemes: parsed.byScheme.size,
    schemesUpdated: bulkResult.totalUpserted,
    hasMoreSchemes: bulkResult.hasMore,
    elapsedMs: Date.now() - startedAt,
    nextFromDate: nextWindow.nextFrom,
    nextToDate: nextWindow.nextTo,
    nextFromAmfi,
    nextToAmfi,
    sampleSchemes,
  };
}
