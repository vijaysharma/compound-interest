import { after } from 'next/server';
import { getDb } from '../db';
import { redisDel, redisGet, redisMGet, redisSet, redisSetIfAbsent } from '../redis';
import { mfNavCache, navPayloadKey } from '@/actions/data/constants';
import { fetchAmfiLatest } from './amfiClient';
import { resolveAmfiFundHouseCode } from './amfiFundHouses';
import { backfillSchemeFromAmfi } from './amfiSchemeBackfill';
import { isSchemeTracked, registerTrackedScheme } from './trackedSchemes';
const todayIso = () => new Date().toISOString().slice(0, 10);
// A genuinely new fund stays short until it has traded long enough, so the full-history walk is
// gated: once it reaches the scheme's first NAV it isn't repeated for a week, and after an AMFI
// failure it waits an hour. The lock keeps concurrent requests from walking the same scheme.
const backfillDoneKey = (schemeCode: string) => `gate:mf:nav:backfill:done:${schemeCode}`;
const backfillFailedKey = (schemeCode: string) => `gate:mf:nav:backfill:failed:${schemeCode}`;
const backfillLockKey = (schemeCode: string) => `gate:mf:nav:backfill:lock:${schemeCode}`;
const backfillResumeKey = (schemeCode: string) => `nav:backfill:resume:${schemeCode}`;
const BACKFILL_RETRY_SECONDS = 60 * 60;
const BACKFILL_DONE_SECONDS = 7 * 24 * 60 * 60;
// The request waits this long for history (a new fund's year or so is 4-6 windows of 1.5-3s);
// the rest continues after the response, inside the 30s function limit the lock outlives.
const BACKFILL_REQUEST_BUDGET_MS = 12_000;
const BACKFILL_BACKGROUND_BUDGET_MS = 14_000;
const BACKFILL_LOCK_SECONDS = 60;
/**
 * The scheme's AMFI fund-house code, from the latest NAV file's heading or stored metadata.
 * `unlisted` means the latest file loaded and doesn't carry the scheme (closed, matured or
 * segregated), so AMFI has nothing current to backfill from.
 */
async function findFundHouseCode(
  schemeCode: string,
  storedNames: Array<string | null>
): Promise<{ code: number | null; unlisted: boolean }> {
  const names: Array<string | null> = [];
  let unlisted = false;
  try {
    const listed = (await fetchAmfiLatest()).schemes.get(schemeCode);
    unlisted = !listed;
    names.push(listed?.fundHouse ?? null);
  } catch (err) {
    console.warn('[nav] AMFI latest fetch failed while resolving fund house:', err);
  }
  names.push(...storedNames);
  for (const name of names) {
    if (!name) continue;
    const code = await resolveAmfiFundHouseCode(name);
    if (code) return { code, unlisted };
  }
  return { code: null, unlisted };
}
export interface SchemeHistoryBackfill {
  rows: number;
  /** Reached the scheme's first NAV, or AMFI no longer lists the scheme. */
  complete: boolean;
  error?: unknown;
}
/**
 * Backfills a scheme's full NAV history from AMFI, continuing a walk an earlier call left
 * unfinished. Drops the cached series when it stored anything, so the next read
 * comes from the DB.
 */
export async function backfillSchemeHistory(
  schemeCode: string,
  { deadline, storedNames = [] }: { deadline: number; storedNames?: Array<string | null> }
): Promise<SchemeHistoryBackfill> {
  const cleanCode = String(schemeCode).trim();
  const { code: fundHouseCode, unlisted } = await findFundHouseCode(cleanCode, storedNames);
  if (!fundHouseCode) {
    // Nothing to walk for a scheme AMFI no longer lists; that is a finished backfill, not a failure.
    if (unlisted) return { rows: 0, complete: true };
    return {
      rows: 0,
      complete: false,
      error: new Error(`No AMFI fund house found for ${cleanCode}`),
    };
  }
  const fromIso = (await redisGet<string>(backfillResumeKey(cleanCode))) ?? todayIso();
  const result = await backfillSchemeFromAmfi(cleanCode, fundHouseCode, { fromIso, deadline });
  if (result.resumeFrom) {
    await redisSet(backfillResumeKey(cleanCode), result.resumeFrom, BACKFILL_DONE_SECONDS).catch(
      () => false
    );
  } else {
    await redisDel(backfillResumeKey(cleanCode)).catch(() => false);
  }
  if (result.rows > 0) {
    mfNavCache.delete(cleanCode);
    await redisDel(navPayloadKey(cleanCode)).catch(() => false);
  }
  if (result.schemeName) {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload, updated_at)
        VALUES (${Number(cleanCode)}, ${result.schemeName}, ${JSON.stringify({ schemeCode: Number(cleanCode), schemeName: result.schemeName })}::jsonb, NOW())
        ON CONFLICT (scheme_code) DO NOTHING
      `;
    } catch {
      // Ignore schemes table insertion failure
    }
  }
  return { rows: result.rows, complete: result.complete, error: result.error };
}
/**
 * A stored history shorter than this is a partial import, not a backfill: the AMFI single-day
 * import gives every scheme one row, and the daily sync then adds one more per trading day. Treating
 * "has any row" as "backfilled" left such schemes stuck on a few days of NAV forever.
 */
export const MIN_BACKFILLED_NAV_ROWS = 30;
export const hasShortNavHistory = (payload: { data?: unknown } | null | undefined): boolean =>
  !payload || !Array.isArray(payload.data) || payload.data.length < MIN_BACKFILLED_NAV_ROWS;
/**
 * Schemes whose history walk stopped part-way (time budget) and should continue: by then they
 * usually hold more than MIN_BACKFILLED_NAV_ROWS, so the length check alone would never resume them.
 */
export async function pendingHistoryBackfills(schemeCodes: string[]): Promise<Set<string>> {
  if (schemeCodes.length === 0) return new Set();
  const cursors = await redisMGet<string>(schemeCodes.map(backfillResumeKey));
  return new Set(schemeCodes.filter((code) => cursors[backfillResumeKey(code)]));
}
async function runGatedBackfill(
  schemeCode: string,
  budgetMs: number,
  storedNames: Array<string | null>
): Promise<SchemeHistoryBackfill> {
  const result = await backfillSchemeHistory(schemeCode, {
    deadline: Date.now() + budgetMs,
    storedNames,
  });
  if (result.complete) {
    await redisSet(backfillDoneKey(schemeCode), Date.now(), BACKFILL_DONE_SECONDS).catch(
      () => false
    );
  } else if (result.error) {
    console.warn(`[nav] AMFI history backfill failed for ${schemeCode}:`, result.error);
    await redisSet(backfillFailedKey(schemeCode), Date.now(), BACKFILL_RETRY_SECONDS).catch(
      () => false
    );
  }
  return result;
}
// Codes this instance has confirmed are on the tracked list; tracking is never removed by reads.
const confirmedTracked = new Set<string>();
/**
 * Adds a scheme someone looked up to the tracked list, which the nightly cron keeps current.
 * Returns the fund-house name stored for it, if any.
 */
async function trackScheme(cleanCode: string): Promise<string | null> {
  const sql = getDb();
  const lookup = (await sql`
    SELECT scheme_name, payload FROM mutual_fund_schemes WHERE scheme_code = ${Number(cleanCode)} LIMIT 1
  `) as Array<{ scheme_name: string; payload?: { fund_house?: string } }>;
  const amfiName = lookup[0]?.payload?.fund_house ?? null;
  if (!confirmedTracked.has(cleanCode)) {
    if (!(await isSchemeTracked(cleanCode))) {
      await registerTrackedScheme(
        cleanCode,
        lookup[0]?.scheme_name ?? `Scheme ${cleanCode}`,
        amfiName
      );
    }
    confirmedTracked.add(cleanCode);
  }
  return amfiName;
}
/** Cheap after the first call per instance: makes sure a looked-up scheme is tracked. */
export async function ensureSchemeTracked(schemeCode: string): Promise<void> {
  const cleanCode = String(schemeCode).trim();
  if (confirmedTracked.has(cleanCode) || !/^\d{1,10}$/.test(cleanCode)) return;
  try {
    await trackScheme(cleanCode);
  } catch (err) {
    console.warn(`[nav] could not track scheme ${cleanCode}:`, err);
  }
}
export async function ensureSchemeTrackedAndBackfilled(schemeCode: string): Promise<boolean> {
  const cleanCode = String(schemeCode).trim();
  const numCode = Number(cleanCode);
  if (!Number.isFinite(numCode) || numCode <= 0) return false;
  const sql = getDb();
  const existing = (await sql`
    SELECT count(*) as count FROM mutual_fund_nav WHERE scheme_code = ${numCode}
  `) as Array<{ count: string | number }>;
  const storedRows = Number(existing[0]?.count ?? 0);
  const amfiName = await trackScheme(cleanCode);
  if (storedRows >= MIN_BACKFILLED_NAV_ROWS && !(await redisGet(backfillResumeKey(cleanCode)))) {
    return true;
  }
  if (
    (await redisGet(backfillDoneKey(cleanCode))) ||
    (await redisGet(backfillFailedKey(cleanCode)))
  ) {
    return storedRows > 0;
  }
  if (!(await redisSetIfAbsent(backfillLockKey(cleanCode), Date.now(), BACKFILL_LOCK_SECONDS))) {
    return storedRows > 0;
  }
  const storedNames = [amfiName];
  const first = await runGatedBackfill(cleanCode, BACKFILL_REQUEST_BUDGET_MS, storedNames);
  if (!first.complete && !first.error) {
    const finish = () =>
      runGatedBackfill(cleanCode, BACKFILL_BACKGROUND_BUDGET_MS, storedNames)
        .catch((err) =>
          console.warn(`[nav] background history backfill failed for ${cleanCode}:`, err)
        )
        .finally(() => redisDel(backfillLockKey(cleanCode)).catch(() => false));
    try {
      after(finish);
    } catch {
      void finish();
    }
  } else {
    await redisDel(backfillLockKey(cleanCode)).catch(() => false);
  }
  return first.rows > 0 || storedRows > 0;
}
