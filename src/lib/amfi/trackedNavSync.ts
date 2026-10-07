import { getDb } from '../db';
import { redisDel, redisGet, redisSet } from '../redis';
import { mfNavCache, navPayloadKey } from '@/actions/data/constants';
import { formatAmfiDate } from './amfiDate';
import { fetchAmfiHistoricalChunk, fetchAmfiLatest } from './amfiClient';
import { resolveAmfiFundHouseCode } from './amfiFundHouses';
import { upsertWhitelistedNavBatch } from './amfiNavStorage';
import type { AmfiNavRecord } from './amfiNavTypes';
import { AMFI_HISTORY_FLOOR_ISO } from './amfiSchemeBackfill';
import type { AmfiParseResult } from './amfiTypes';
/**
 * Nightly NAV update for the tracked list (the only schemes whose NAV is stored).
 *
 * One AMFI history request covers the last RECENT_DAYS for every fund house (~6 MB, ~3s), so a
 * missed night or two heals itself. A tracked scheme whose stored series ends before that window
 * has a gap; it is queued, and the queue is drained by walking that fund house's history report
 * back to where the stored series ends — across nights if it doesn't fit in one run.
 */
const RECENT_DAYS = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 89;
const RECENT_TIMEOUT_MS = 20_000;
const CATCHUP_CHUNK_TIMEOUT_MS = 15_000;
const QUEUE_KEY = 'nav:catchup:queue';
const QUEUE_TTL_SECONDS = 30 * 24 * 60 * 60;
interface GapEntry {
  fundHouse: string;
  /** Last stored NAV date; the gap is everything after it. */
  untilIso: string;
  /** The next window to fetch ends on this date. */
  resumeFrom: string;
}
type GapQueue = Record<string, GapEntry>;
export interface TrackedNavSyncReport {
  tracked: number;
  window: { from: string; to: string };
  recentRows: number;
  schemesUpdated: number;
  namesUpserted: number;
  gapsQueued: number;
  gapsFilled: number;
  gapsRemaining: number;
  catchupRows: number;
  error?: string;
}
const shiftIso = (iso: string, days: number) =>
  new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * MS_PER_DAY).toISOString().slice(0, 10);
/** Today in IST, the calendar AMFI dates NAVs in. */
const todayIst = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
const toRecords = (parsed: AmfiParseResult, codes: Set<string>): AmfiNavRecord[] =>
  parsed.records
    .filter((r) => codes.has(r.schemeCode))
    .map((r) => ({
      schemeCode: r.schemeCode,
      schemeName: r.schemeName,
      nav: r.navNumeric,
      date: r.isoDate,
    }));
/** Scheme names for search, from NAVAll.txt; refreshed for every scheme AMFI lists, NAV or not. */
async function upsertSchemeNames(parsed: AmfiParseResult): Promise<number> {
  const rows = [...parsed.schemes.values()].map((meta) => ({
    scheme_code: meta.schemeCode,
    scheme_name: meta.schemeName,
    payload: {
      scheme_code: meta.schemeCode,
      scheme_name: meta.schemeName,
      isin_growth: meta.isinGrowth,
    },
  }));
  if (rows.length === 0) return 0;
  const sql = getDb();
  for (let i = 0; i < rows.length; i += 2000) {
    await sql`
      INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload, updated_at)
      SELECT x.scheme_code::integer, x.scheme_name, x.payload, NOW()
      FROM jsonb_to_recordset(${JSON.stringify(rows.slice(i, i + 2000))}::jsonb) AS x(
        scheme_code TEXT,
        scheme_name TEXT,
        payload JSONB
      )
      ON CONFLICT (scheme_code) DO UPDATE SET scheme_name = EXCLUDED.scheme_name, updated_at = NOW()
    `;
  }
  return rows.length;
}
/** Cached series for these schemes are now behind the DB; drop them so the next read refills. */
async function invalidateCachedSeries(codes: Iterable<string>): Promise<void> {
  const keys: string[] = [];
  for (const code of codes) {
    mfNavCache.delete(code);
    keys.push(navPayloadKey(code));
  }
  for (let i = 0; i < keys.length; i += 500) {
    await redisDel(keys.slice(i, i + 500)).catch(() => false);
  }
}
async function drainGapQueue(
  queue: GapQueue,
  trackedCodes: Set<string>,
  deadline: number
): Promise<{ filled: number; rows: number; touched: Set<string> }> {
  const touched = new Set<string>();
  let filled = 0;
  let rows = 0;
  const byHouse = new Map<string, string[]>();
  for (const [code, entry] of Object.entries(queue)) {
    if (!trackedCodes.has(code)) {
      delete queue[code];
      continue;
    }
    byHouse.set(entry.fundHouse, [...(byHouse.get(entry.fundHouse) ?? []), code]);
  }
  for (const [fundHouse, codes] of byHouse) {
    const mf = await resolveAmfiFundHouseCode(fundHouse);
    if (!mf) {
      console.warn(
        `[nav][cron] no AMFI code for fund house "${fundHouse}"; dropping ${codes.length} gaps`
      );
      for (const code of codes) delete queue[code];
      continue;
    }
    let pending = new Set(codes);
    let toIso = codes
      .map((c) => queue[c].resumeFrom)
      .sort()
      .at(-1)!;
    while (pending.size > 0 && Date.now() < deadline) {
      const windowStart = shiftIso(toIso, -WINDOW_DAYS);
      let parsed: AmfiParseResult;
      try {
        parsed = await fetchAmfiHistoricalChunk(
          formatAmfiDate(windowStart),
          formatAmfiDate(toIso),
          String(mf),
          CATCHUP_CHUNK_TIMEOUT_MS
        );
      } catch (err) {
        console.warn(`[nav][cron] gap fill for ${fundHouse} failed at ${toIso}:`, err);
        break;
      }
      const records = toRecords(parsed, pending);
      if (records.length > 0) {
        rows += await upsertWhitelistedNavBatch(records, 5000);
        for (const r of records) touched.add(r.schemeCode);
      }
      const nextTo = shiftIso(windowStart, -1);
      const withRows = new Set(records.map((r) => r.schemeCode));
      const stillPending = new Set<string>();
      for (const code of pending) {
        // A scheme with nothing stored is done at its first NAV-less window (before its launch).
        const reachedLaunch =
          queue[code].untilIso === AMFI_HISTORY_FLOOR_ISO && !withRows.has(code);
        if (reachedLaunch || queue[code].untilIso >= windowStart) {
          delete queue[code];
          filled += 1;
        } else {
          queue[code].resumeFrom = nextTo;
          stillPending.add(code);
        }
      }
      pending = stillPending;
      toIso = nextTo;
    }
    if (Date.now() >= deadline) break;
  }
  return { filled, rows, touched };
}
export async function syncTrackedSchemesFromAmfi({
  deadline,
}: {
  deadline: number;
}): Promise<TrackedNavSyncReport> {
  const sql = getDb();
  const tracked = (await sql`
    SELECT t.scheme_code, max(n.date)::text AS latest
    FROM tracked_schemes t
    LEFT JOIN mutual_fund_nav n ON n.scheme_code = t.scheme_code::integer
    WHERE t.is_active = TRUE
    GROUP BY t.scheme_code
  `) as Array<{ scheme_code: string; latest: string | null }>;
  const trackedCodes = new Set(tracked.map((t) => String(t.scheme_code)));
  const to = todayIst();
  const from = shiftIso(to, -(RECENT_DAYS - 1));
  const report: TrackedNavSyncReport = {
    tracked: trackedCodes.size,
    window: { from, to },
    recentRows: 0,
    schemesUpdated: 0,
    namesUpserted: 0,
    gapsQueued: 0,
    gapsFilled: 0,
    gapsRemaining: 0,
    catchupRows: 0,
  };
  const queue: GapQueue = (await redisGet<GapQueue>(QUEUE_KEY)) ?? {};
  const touched = new Set<string>();
  try {
    const recent = await fetchAmfiHistoricalChunk(
      formatAmfiDate(from),
      formatAmfiDate(to),
      undefined,
      RECENT_TIMEOUT_MS
    );
    const records = toRecords(recent, trackedCodes);
    report.recentRows = await upsertWhitelistedNavBatch(records, 5000);
    for (const r of records) touched.add(r.schemeCode);
    report.schemesUpdated = touched.size;
    // Gaps are judged on the series as it stood before this window was added.
    for (const { scheme_code, latest } of tracked) {
      const code = String(scheme_code);
      const fundHouse = recent.schemes.get(code)?.fundHouse;
      if (!fundHouse || queue[code]) continue;
      if (latest && latest >= shiftIso(from, -1)) continue;
      queue[code] = {
        fundHouse,
        untilIso: latest ?? AMFI_HISTORY_FLOOR_ISO,
        resumeFrom: shiftIso(from, -1),
      };
      report.gapsQueued += 1;
    }
    // Names come from NAVAll.txt, the format every stored name uses, not the history report.
    report.namesUpserted = await upsertSchemeNames(await fetchAmfiLatest(RECENT_TIMEOUT_MS));
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err);
    console.warn('[nav][cron] recent AMFI window failed:', err);
  }
  const drained = await drainGapQueue(queue, trackedCodes, deadline);
  report.gapsFilled = drained.filled;
  report.catchupRows = drained.rows;
  for (const code of drained.touched) touched.add(code);
  report.gapsRemaining = Object.keys(queue).length;
  await redisSet(QUEUE_KEY, queue, QUEUE_TTL_SECONDS).catch(() => false);
  await invalidateCachedSeries(touched);
  return report;
}
