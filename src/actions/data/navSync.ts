import { getDb, MF_URL } from '@/lib/db';
import { redisSet } from '@/lib/redis';
import { latestNavDateIn } from '../../utilities/navCalendar';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
  parseNavPayload,
} from './constants';
import {
  claimSchemeRefresh,
  probeMarketWatermark,
  readWatermark,
  recordSchemeOutcome,
} from './navWatermark';
export type NavPayload = { data: unknown[]; [k: string]: unknown };
/**
 * Refreshing a scheme's history from upstream, and the background maintenance
 * that decides when to do it.
 *
 * ## Why none of this is on the request path
 *
 * api.mfapi.in answered identical full-history requests in 1.2s and in 62s when
 * measured, and even its 349-byte `/latest` endpoint took 60s on one call. There
 * is no timeout that makes a synchronous upstream fetch safe: set it low and it
 * aborts a response that was about to arrive, set it high and a user stares at a
 * spinner for a minute. The only sound answer is to never make a user wait for
 * it.
 *
 * So reads serve whatever is already stored — memory, Redis, Postgres — and
 * refreshes happen afterwards, through `after()` once the response is already
 * on the wire, or on a schedule via the cron route. The single exception is a
 * scheme we have never seen, where there is nothing to serve and blocking is the
 * only option; that happens once per scheme, ever.
 */
/**
 * Generous because nothing is waiting on it. The measured worst case was 62s,
 * and `vercel.json` caps a function at 30s, so this is the useful ceiling
 * rather than an arbitrary one.
 */
export const BACKGROUND_FETCH_TIMEOUT_MS = 25_000;
/**
 * The one place a user does wait: first ever request for a scheme, where the
 * alternative is an empty chart. Bounded well below the background timeout so a
 * pathological provider response gives up rather than holding the page.
 */
export const FIRST_FETCH_TIMEOUT_MS = 15_000;
function rememberPayload(schemeCode: string, payload: NavPayload): void {
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
    latest: latestNavDateIn(payload.data as Array<{ date?: string }>),
  });
  redisSet(navPayloadKey(schemeCode), payload, NAV_CACHE_TTL_SECONDS).catch(() => {});
}
/**
 * Fetches one scheme's full history and stores it everywhere.
 *
 * `previous` is what we already hold, used only to refuse a regression: the
 * upstream row is the sole copy of this history, and a truncated response would
 * otherwise overwrite it permanently.
 */
export async function syncSchemeFromUpstream(
  schemeCode: string,
  timeoutMs: number,
  previous?: NavPayload | null
): Promise<NavPayload | null> {
  let payload: NavPayload | null = null;
  try {
    const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!upstream.ok) return null;
    payload = parseNavPayload(await upstream.json());
  } catch (err) {
    console.warn(`[nav] upstream fetch failed for ${schemeCode}:`, err);
    return null;
  }
  if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) return null;
  const isAtLeastAsComplete = !previous || payload.data.length >= previous.data.length;
  if (isAtLeastAsComplete) {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO mutual_fund_nav (scheme_code, payload, latest_nav_date, updated_at)
        VALUES (
          ${schemeCode},
          ${JSON.stringify(payload)}::jsonb,
          ${latestNavDateIn(payload.data as Array<{ date?: string }>)}::date,
          NOW()
        )
        ON CONFLICT (scheme_code) DO UPDATE SET
          payload = EXCLUDED.payload,
          latest_nav_date = EXCLUDED.latest_nav_date,
          updated_at = NOW()
      `;
    } catch (dbErr) {
      console.warn(`[nav] DB sync failed for ${schemeCode}:`, dbErr);
    }
  } else {
    console.warn(
      `[nav] upstream payload for ${schemeCode} is shorter than stored ` +
        `(${payload.data.length} < ${previous?.data.length}); keeping stored history.`
    );
    return previous ?? payload;
  }
  rememberPayload(schemeCode, payload);
  return payload;
}
/**
 * What a refresh attempt did, so callers can report it.
 *
 * `gated` and `behind` are the interesting ones: together they identify a
 * scheme that upstream will never bring level — a merged or matured fund — as
 * distinct from one that simply has not been tried yet.
 */
export type RefreshOutcome =
  /** Already level with the watermark; nothing to do. */
  | 'current'
  /** Its backoff window is closed, so it was skipped without touching upstream. */
  | 'gated'
  /** Fetched and now level with the watermark. */
  | 'refreshed'
  /** Fetched, but upstream's own newest NAV is still behind the watermark. */
  | 'behind'
  /** Upstream could not be reached, or returned nothing usable. */
  | 'failed';
/**
 * Brings one scheme up to the watermark if it is behind and its own backoff
 * window is open.
 *
 * Records whether it caught up, which is what lets a delisted or unpriced
 * scheme settle at one attempt per day instead of retrying forever.
 */
export async function refreshSchemeIfStale(
  schemeCode: string,
  current: NavPayload | null,
  timeoutMs: number = BACKGROUND_FETCH_TIMEOUT_MS
): Promise<RefreshOutcome> {
  const watermark = await readWatermark();
  const currentLatest = current ? latestNavDateIn(current.data as Array<{ date?: string }>) : null;
  if (watermark?.date && currentLatest && currentLatest >= watermark.date) {
    return 'current';
  }
  if (!(await claimSchemeRefresh(schemeCode))) return 'gated';
  const refreshed = await syncSchemeFromUpstream(schemeCode, timeoutMs, current);
  if (!refreshed) {
    await recordSchemeOutcome(schemeCode, false);
    return 'failed';
  }
  const newLatest = latestNavDateIn(refreshed.data as Array<{ date?: string }>);
  const caughtUp = Boolean(newLatest && (!watermark?.date || newLatest >= watermark.date));
  await recordSchemeOutcome(schemeCode, caughtUp);
  return caughtUp ? 'refreshed' : 'behind';
}
/**
 * The background job: find out whether the market moved, then bring the schemes
 * this request touched up to it.
 *
 * Intended for `after()`. Never throws — a failure here must not surface on a
 * response that has already been sent successfully.
 */
export async function runNavMaintenance(
  schemes: Array<{ code: string; current: NavPayload | null }>
): Promise<void> {
  try {
    await probeMarketWatermark();
    for (const { code, current } of schemes) {
      await refreshSchemeIfStale(code, current);
    }
  } catch (err) {
    console.warn('[nav] background maintenance failed:', err);
  }
}
