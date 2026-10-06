import { formatAmfiDate } from './amfiDate';
import { fetchAmfiHistoricalChunk } from './amfiClient';
import { upsertWhitelistedNavBatch } from './amfiNavStorage';
import type { AmfiNavRecord } from './amfiNavTypes';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
/** The AMFI report allows at most 90 days per request. */
const WINDOW_DAYS = 89;
/** Oldest NAV date AMFI's history report serves. */
export const AMFI_HISTORY_FLOOR_ISO = '2006-04-01';
const CHUNK_TIMEOUT_MS = 20_000;
const shiftIso = (iso: string, days: number) =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
export interface AmfiSchemeBackfillResult {
  /** NAV rows written to mutual_fund_nav. */
  rows: number;
  /** The walk reached the scheme's first NAV (a window without any) or AMFI's floor. */
  complete: boolean;
  /** Where to continue when not complete: the next window ends on this date. */
  resumeFrom: string | null;
  schemeName: string | null;
  error?: unknown;
}
/**
 * Backfills one scheme's NAV history from AMFI's history report, newest window first, until a
 * 90-day window holds no NAV for it (it hadn't launched yet) or `deadline` passes. Each window is
 * stored as it arrives, so a walk cut short keeps what it fetched and can resume at `resumeFrom`.
 */
export async function backfillSchemeFromAmfi(
  schemeCode: string,
  fundHouseCode: number,
  { fromIso, deadline }: { fromIso: string; deadline: number }
): Promise<AmfiSchemeBackfillResult> {
  let toIso = fromIso;
  let rows = 0;
  let schemeName: string | null = null;
  while (toIso >= AMFI_HISTORY_FLOOR_ISO) {
    if (Date.now() >= deadline) return { rows, complete: false, resumeFrom: toIso, schemeName };
    const windowStart = shiftIso(toIso, -WINDOW_DAYS);
    const startIso = windowStart < AMFI_HISTORY_FLOOR_ISO ? AMFI_HISTORY_FLOOR_ISO : windowStart;
    let records: AmfiNavRecord[];
    try {
      const parsed = await fetchAmfiHistoricalChunk(
        formatAmfiDate(startIso),
        formatAmfiDate(toIso),
        String(fundHouseCode),
        CHUNK_TIMEOUT_MS
      );
      schemeName ??= parsed.schemes.get(schemeCode)?.schemeName ?? null;
      records = parsed.records
        .filter((r) => r.schemeCode === schemeCode)
        .map((r) => ({ schemeCode, schemeName: r.schemeName, nav: r.navNumeric, date: r.isoDate }));
    } catch (error) {
      return { rows, complete: false, resumeFrom: toIso, schemeName, error };
    }
    if (records.length === 0) return { rows, complete: true, resumeFrom: null, schemeName };
    rows += await upsertWhitelistedNavBatch(records, 5000);
    toIso = shiftIso(startIso, -1);
  }
  return { rows, complete: true, resumeFrom: null, schemeName };
}
