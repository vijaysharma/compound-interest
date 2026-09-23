import { after } from 'next/server';
import { getDb } from '@/lib/db';
import { redisGet } from '@/lib/redis';
import { ISO_DATE_REGEX, resolveDateRange } from '@/utilities/dateGuards';
import { latestNavDateIn } from '@/utilities/navCalendar';
import { sliceNavHistory } from '@/utilities/navSlice';
import {
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
  parseNavPayload,
} from './constants';
import { resolveFreshnessCeiling } from './navWatermark';
import {
  FIRST_FETCH_TIMEOUT_MS,
  type NavPayload,
  runNavMaintenance,
  syncSchemeFromUpstream,
} from './navSync';
/**
 * Best copy of a scheme's history we already hold, and where it came from.
 *
 * The layers are probed newest-first but *none of them gates on freshness*, in
 * a deliberate reversal of how this used to work. Freshness no longer decides
 * whether to answer — it decides whether to schedule a refresh afterwards.
 * Judging it up front is what made a stale-but-usable payload turn into a
 * blocking upstream fetch on every request.
 */
async function readStored(schemeCode: string): Promise<{
  payload: NavPayload | null;
  latest: string | null;
  fromDb: boolean;
}> {
  const cached = mfNavCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now()) {
    const payload = parseNavPayload(cached.data);
    if (payload) {
      // `latest` was stored at write time; recomputing it here would walk every
      // row on the one path that is supposed to be instant.
      const latest =
        cached.latest !== undefined
          ? cached.latest
          : latestNavDateIn(payload.data as Array<{ date?: string }>);
      return { payload, latest, fromDb: false };
    }
  }
  const redisPayload = parseNavPayload(await redisGet(navPayloadKey(schemeCode)));
  if (redisPayload) {
    const latest = latestNavDateIn(redisPayload.data as Array<{ date?: string }>);
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
      data: redisPayload,
      latest,
    });
    return { payload: redisPayload, latest, fromDb: false };
  }
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT payload, latest_nav_date::text AS latest_nav_date
      FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown; latest_nav_date: string | null }>;
    if (rows.length > 0) {
      const payload = parseNavPayload(rows[0].payload);
      if (payload) {
        // The denormalised column when it is there, a scan of the history when
        // it is not — the column is backfilled lazily, so both cases are live.
        const latest =
          rows[0].latest_nav_date ??
          latestNavDateIn(payload.data as Array<{ date?: string }>);
        mfNavCache.set(schemeCode, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: payload,
          latest,
        });
        return { payload, latest, fromDb: true };
      }
    }
  } catch (dbErr) {
    console.warn('[nav] DB read failed:', dbErr);
  }
  return { payload: null, latest: null, fromDb: false };
}
/**
 * Serves a scheme's NAV history.
 *
 * `requestedStartDate` is optional and, when given, trims the response to that
 * window plus a lookup margin. It has to be the *raw* value rather than
 * anything `resolveDateRange` produces, because that helper invents a start
 * date three months back when none is supplied — using it would quietly cut
 * every full-history caller down to ninety days.
 */
export async function handleGetMutualFundNav(
  schemeCodeRaw: string | number,
  requestedEndDate?: string | null,
  requestedStartDate?: string | null
): Promise<unknown> {
  const schemeCode = String(schemeCodeRaw).trim();
  if (!/^\d{1,10}$/.test(schemeCode)) {
    throw new Error('Invalid scheme code. Must be numeric.');
  }
  const { endDate } = resolveDateRange(undefined, requestedEndDate);
  const explicitStart =
    requestedStartDate && ISO_DATE_REGEX.test(requestedStartDate.trim())
      ? requestedStartDate.trim()
      : null;
  const stored = await readStored(schemeCode);
  // Nothing at all: the one case where a user has to wait, because an empty
  // chart is worse than a pause. Once per scheme, ever.
  if (!stored.payload) {
    const fetched = await syncSchemeFromUpstream(schemeCode, FIRST_FETCH_TIMEOUT_MS, null);
    if (!fetched) {
      throw new Error('Failed to fetch mutual fund NAV data');
    }
    scheduleMaintenance([{ code: schemeCode, current: fetched }]);
    const firstCeiling = await resolveFreshnessCeiling(
      endDate,
      latestNavDateIn(fetched.data as Array<{ date?: string }>)
    );
    return withResponseMeta(fetched, firstCeiling, explicitStart, endDate);
  }
  // The ceiling is the newest NAV known to exist, seeded from what we hold so a
  // cold Redis does not fall back to guessing. It no longer gates the response.
  const ceiling = await resolveFreshnessCeiling(endDate, stored.latest);
  const isFresh = Boolean(stored.latest && stored.latest >= ceiling);
  // Either way the caller gets data now; only the follow-up work differs.
  if (!isFresh) {
    scheduleMaintenance([{ code: schemeCode, current: stored.payload }]);
  }
  return withResponseMeta(stored.payload, ceiling, explicitStart, endDate);
}
/**
 * Attaches `marketAsOf` — the newest NAV known to exist — to the response.
 *
 * Without it the browser has to decide for itself whether its cached copy is
 * current, and the only thing it can do that with is the calendar prediction
 * this server no longer uses. The two would disagree on every request during a
 * publication gap: the browser would call a payload stale, ask the server, and
 * the server would hand back the very same bytes it already had. Publishing the
 * watermark keeps both sides on one definition of "current" by construction.
 */
export function withResponseMeta(
  payload: NavPayload,
  marketAsOf: string,
  startDate: string | null,
  endDate: string
): NavPayload {
  const rows = startDate
    ? sliceNavHistory(payload.data as Array<{ date?: string }>, startDate, endDate)
    : payload.data;
  const data = rows === payload.data ? payload.data : (rows as unknown[]);
  return { ...payload, data, marketAsOf };
}
/**
 * Hands the refresh to `after()`, which runs once the response has been sent.
 *
 * Wrapped because `after()` throws outside a request scope — the cron route and
 * any direct call would otherwise fail on the scheduling rather than the work.
 * Falling back to fire-and-forget keeps the refresh happening in those contexts.
 */
export function scheduleMaintenance(
  schemes: Array<{ code: string; current: NavPayload | null }>
): void {
  try {
    after(() => runNavMaintenance(schemes));
  } catch {
    void runNavMaintenance(schemes);
  }
}
