import { getDb, MF_URL } from '@/lib/db';
import { redisGet, redisIncr, redisSet } from '@/lib/redis';
import { resolveDateRange } from '@/utilities/dateGuards';
import { navFreshnessCeiling } from '@/utilities/navCalendar';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  NAV_SYNC_COOLDOWN_SECONDS,
  NAV_UPSTREAM_TIMEOUT_MS,
  getLatestNavDateISO,
  isNavPayloadFresh,
  mfNavCache,
  navPayloadKey,
  navSyncGateKey,
  parseNavPayload,
} from './constants';
type NavPayload = { data: unknown[]; [k: string]: unknown };
/**
 * Claims the right to re-sync one scheme from upstream.
 *
 * `INCR` on a key with a TTL is an atomic counter, so exactly one caller sees
 * `1` within the cooldown window and everyone else sees a higher number and
 * serves what it already has. That does two jobs: it collapses a burst of
 * concurrent requests for the same cold scheme into one upstream fetch, and it
 * stops an unsatisfiable freshness ceiling — a holiday, a suspended scheme —
 * from turning every request back into an upstream call.
 *
 * Fails open: if Redis is unreachable the fetch is allowed rather than blocked,
 * because a slow correct answer beats a fast empty one.
 */
async function claimSyncSlot(schemeCode: string): Promise<boolean> {
  try {
    const attempts = await redisIncr(navSyncGateKey(schemeCode), NAV_SYNC_COOLDOWN_SECONDS);
    return attempts <= 1;
  } catch {
    return true;
  }
}
function rememberPayload(schemeCode: string, payload: NavPayload): void {
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
  });
  redisSet(navPayloadKey(schemeCode), payload, NAV_CACHE_TTL_SECONDS).catch(() => {});
}
export async function handleGetMutualFundNav(
  schemeCodeRaw: string | number,
  requestedEndDate?: string | null
): Promise<unknown> {
  const schemeCode = String(schemeCodeRaw).trim();
  if (!/^\d{1,10}$/.test(schemeCode)) {
    throw new Error('Invalid scheme code. Must be numeric.');
  }
  const { endDate } = resolveDateRange(undefined, requestedEndDate);
  // The newest NAV that can exist, not the date the caller asked for. Comparing
  // against the request is what made every cache layer miss on every call.
  const ceiling = navFreshnessCeiling(endDate);
  const cached = mfNavCache.get(schemeCode);
  // `expiresAt` was previously written and never read, so a process served its
  // first payload for as long as it lived.
  if (cached && cached.expiresAt > Date.now() && isNavPayloadFresh(cached.data, ceiling)) {
    return parseNavPayload(cached.data);
  }
  const redisNav = parseNavPayload(await redisGet(navPayloadKey(schemeCode)));
  if (redisNav && isNavPayloadFresh(redisNav, ceiling)) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
      data: redisNav,
    });
    return redisNav;
  }
  let storedPayload: NavPayload | null = null;
  try {
    const sql = getDb();
    const stored = (await sql`
      SELECT payload, latest_nav_date::text AS latest_nav_date
      FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown; latest_nav_date: string | null }>;
    if (stored.length > 0) {
      storedPayload = parseNavPayload(stored[0].payload);
      // Prefer the denormalised column: it answers the freshness question
      // without parsing the history and scanning it for a maximum. A NULL means
      // the row predates the column, so fall back to doing exactly that.
      const storedLatest = stored[0].latest_nav_date;
      const isFresh = storedLatest
        ? storedLatest >= ceiling
        : Boolean(storedPayload && isNavPayloadFresh(storedPayload, ceiling));
      if (storedPayload && isFresh) {
        rememberPayload(schemeCode, storedPayload);
        return storedPayload;
      }
    }
  } catch (dbErr) {
    console.warn('DB check in getMutualFundNavAction failed:', dbErr);
  }
  // Nothing on hand reaches the ceiling. Go upstream only if this request wins
  // the cooldown slot; otherwise fall through to the best stale copy below.
  const maySync = !storedPayload || (await claimSyncSlot(schemeCode));
  if (maySync) {
    try {
      const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(NAV_UPSTREAM_TIMEOUT_MS),
      });
      if (upstream.ok) {
        const payload = parseNavPayload(await upstream.json());
        if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
          // Only overwrite when upstream is at least as complete as what we
          // hold. A truncated response would otherwise destroy real history,
          // and this row is the only copy of it.
          const isAtLeastAsComplete =
            !storedPayload || payload.data.length >= storedPayload.data.length;
          if (isAtLeastAsComplete) {
            try {
              const sql = getDb();
              await sql`
                INSERT INTO mutual_fund_nav (scheme_code, payload, latest_nav_date, updated_at)
                VALUES (
                  ${schemeCode},
                  ${JSON.stringify(payload)}::jsonb,
                  ${getLatestNavDateISO(payload)}::date,
                  NOW()
                )
                ON CONFLICT (scheme_code) DO UPDATE SET
                  payload = EXCLUDED.payload,
                  latest_nav_date = EXCLUDED.latest_nav_date,
                  updated_at = NOW()
              `;
            } catch (syncErr) {
              console.warn('DB sync in getMutualFundNavAction failed:', syncErr);
            }
          } else {
            console.warn(
              `Upstream payload for ${schemeCode} is shorter than the stored one ` +
                `(${payload.data.length} < ${storedPayload?.data.length}); keeping stored history.`
            );
          }
          rememberPayload(schemeCode, payload);
          return payload;
        }
      }
    } catch (fetchError) {
      console.warn('Upstream AMFI fetch failed:', fetchError);
    }
  }
  // Best available, newest-first. Serving a payload that stops short of the
  // ceiling is correct and expected: on a holiday, or before the publication
  // window opens, no newer NAV exists to serve.
  if (storedPayload) {
    rememberPayload(schemeCode, storedPayload);
    return storedPayload;
  }
  if (redisNav) return redisNav;
  if (cached) {
    const staleMemory = parseNavPayload(cached.data);
    if (staleMemory) return staleMemory;
  }
  throw new Error('Failed to fetch mutual fund NAV data');
}
