import { getDb } from '@/lib/db';
import { redisGet, redisSet } from '@/lib/redis';
import { latestNavDateIn } from '@/utilities/navCalendar';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
  parseNavPayload,
} from './constants';
import type { NavPayload } from './navSync';
export interface StoredNav {
  payload: NavPayload | null;
  latest: string | null;
  fromDb: boolean;
}
export async function readStored(
  schemeCode: string,
  { bypassCache = false }: { bypassCache?: boolean } = {}
): Promise<StoredNav> {
  if (!bypassCache) {
    const cached = mfNavCache.get(schemeCode);
    if (cached && cached.expiresAt > Date.now()) {
      const payload = parseNavPayload(cached.data);
      if (payload && Array.isArray(payload.data) && payload.data.length > 1) {
        const latest =
          cached.latest !== undefined
            ? cached.latest
            : latestNavDateIn(payload.data as Array<{ date?: string }>);
        return { payload, latest, fromDb: false };
      }
    }
    const redisPayload = parseNavPayload(await redisGet(navPayloadKey(schemeCode)));
    if (redisPayload && Array.isArray(redisPayload.data) && redisPayload.data.length > 1) {
      const latest = latestNavDateIn(redisPayload.data as Array<{ date?: string }>);
      mfNavCache.set(schemeCode, {
        expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
        data: redisPayload,
        latest,
      });
      return { payload: redisPayload, latest, fromDb: false };
    }
  }
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT to_char(date, 'DD-MM-YYYY') as date, nav::text as nav
      FROM mutual_fund_nav
      WHERE scheme_code = ${Number(schemeCode)}
      ORDER BY mutual_fund_nav.date DESC
    `) as Array<{ date: string; nav: string }>;
    if (rows.length > 0) {
      const payload: NavPayload = {
        meta: { scheme_code: schemeCode },
        data: rows,
      };
      const latest = latestNavDateIn(rows);
      mfNavCache.set(schemeCode, {
        expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
        data: payload,
        latest,
      });
      // Cache what the DB served so the next read, on any instance, skips the DB.
      await redisSet(navPayloadKey(schemeCode), payload, NAV_CACHE_TTL_SECONDS).catch(() => false);
      return { payload, latest, fromDb: true };
    }
  } catch (dbErr) {
    console.warn('[nav] DB read failed:', dbErr);
  }
  return { payload: null, latest: null, fromDb: false };
}
/**
 * readStored, backfilling the scheme's full history first when what is stored is missing, only a
 * few days long, or from a backfill that ran out of time. The re-read goes to the DB: the in-process and Redis copies are held for 30 days
 * and the daily refresh rewrites them from the short series, so they would keep serving it.
 */
export async function readStoredWithBackfill(schemeCode: string): Promise<StoredNav> {
  const stored = await readStored(schemeCode);
  const {
    ensureSchemeTracked,
    ensureSchemeTrackedAndBackfilled,
    hasShortNavHistory,
    pendingHistoryBackfills,
  } = await import('@/lib/amfi/autoInclusion');
  if (
    !hasShortNavHistory(stored.payload) &&
    !(await pendingHistoryBackfills([schemeCode])).has(schemeCode)
  ) {
    await ensureSchemeTracked(schemeCode);
    return stored;
  }
  await ensureSchemeTrackedAndBackfilled(schemeCode);
  const refreshed = await readStored(schemeCode, { bypassCache: true });
  if (!refreshed.payload || refreshed.payload.data.length <= (stored.payload?.data.length ?? 0)) {
    return stored;
  }
  return refreshed;
}
/**
 * A cached series behind the market's latest NAV date is re-read from the DB, which the nightly
 * cron keeps current, before anything goes to AMFI. Returns the fresher of the two.
 */
export async function refreshStaleFromDb(
  schemeCode: string,
  stored: StoredNav,
  ceiling: string
): Promise<StoredNav> {
  if (stored.fromDb || !stored.payload || (stored.latest && stored.latest >= ceiling))
    return stored;
  const fromDb = await readStored(schemeCode, { bypassCache: true });
  if (!fromDb.payload || !fromDb.latest || (stored.latest && fromDb.latest <= stored.latest)) {
    return stored;
  }
  return fromDb;
}
