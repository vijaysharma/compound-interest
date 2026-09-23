import { getDb, MF_URL } from '@/lib/db';
import { redisIncr, redisMGet, redisSet } from '@/lib/redis';
import { resolveDateRange } from '@/utilities/dateGuards';
import { navFreshnessCeiling } from '@/utilities/navCalendar';
import {
  NAV_BATCH_CONCURRENCY,
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
 * Runs `task` over `items` with at most `limit` in flight.
 *
 * The batch path previously issued one `Promise.all` leg per missing scheme, so
 * a ten-fund portfolio opened ten concurrent full-history downloads against the
 * third-party API — enough to get rate-limited, and enough that one slow scheme
 * held the whole invocation open.
 */
async function mapWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await task(item);
    }
  });
  await Promise.all(workers);
}
/** See `claimSyncSlot` in `mfNavHandler` — same gate, same reasoning. */
async function claimSyncSlot(schemeCode: string): Promise<boolean> {
  try {
    const attempts = await redisIncr(navSyncGateKey(schemeCode), NAV_SYNC_COOLDOWN_SECONDS);
    return attempts <= 1;
  } catch {
    return true;
  }
}
function rememberPayload(schemeCode: string, payload: NavPayload, toRedis: boolean): void {
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
  });
  if (toRedis) {
    redisSet(navPayloadKey(schemeCode), payload, NAV_CACHE_TTL_SECONDS).catch(() => {});
  }
}
export async function handleGetBatchMutualFundNav(
  schemeCodesRaw: (string | number)[],
  requestedEndDate?: string | null
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  if (!Array.isArray(schemeCodesRaw) || schemeCodesRaw.length === 0) {
    return result;
  }
  const validCodes = Array.from(
    new Set(
      schemeCodesRaw
        .map((c) => String(c).trim())
        .filter((c) => /^\d{1,10}$/.test(c))
    )
  );
  if (validCodes.length === 0) return result;
  const { endDate } = resolveDateRange(undefined, requestedEndDate);
  const ceiling = navFreshnessCeiling(endDate);
  const missingFromMemory: string[] = [];
  for (const code of validCodes) {
    const cached = mfNavCache.get(code);
    if (cached && cached.expiresAt > Date.now() && isNavPayloadFresh(cached.data, ceiling)) {
      result[code] = parseNavPayload(cached.data);
      continue;
    }
    missingFromMemory.push(code);
  }
  if (missingFromMemory.length === 0) {
    return result;
  }
  const redisResults = await redisMGet<unknown>(missingFromMemory.map(navPayloadKey));
  const missingFromRedis: string[] = [];
  for (const code of missingFromMemory) {
    const parsed = parseNavPayload(redisResults[navPayloadKey(code)]);
    if (parsed && isNavPayloadFresh(parsed, ceiling)) {
      result[code] = parsed;
      rememberPayload(code, parsed, false);
      continue;
    }
    missingFromRedis.push(code);
  }
  if (missingFromRedis.length === 0) {
    return result;
  }
  // Kept so a scheme whose upstream refresh is skipped or fails can still be
  // answered from the newest copy we hold, rather than dropped from the result.
  const storedFallbacks = new Map<string, NavPayload>();
  const missingFromDb: string[] = [];
  try {
    const sql = getDb();
    const stored = (await sql`
      SELECT scheme_code, payload, latest_nav_date::text AS latest_nav_date
      FROM mutual_fund_nav WHERE scheme_code = ANY(${missingFromRedis})
    `) as Array<{ scheme_code: string; payload: unknown; latest_nav_date: string | null }>;
    const storedMap = new Map<string, NavPayload>();
    const storedLatest = new Map<string, string | null>();
    for (const row of stored) {
      const parsed = parseNavPayload(row.payload);
      if (parsed) {
        storedMap.set(row.scheme_code, parsed);
        storedLatest.set(row.scheme_code, row.latest_nav_date);
      }
    }
    for (const code of missingFromRedis) {
      const storedPayload = storedMap.get(code);
      if (storedPayload) {
        // The column when present, a parse of the payload when it is not.
        const latest = storedLatest.get(code);
        const isFresh = latest ? latest >= ceiling : isNavPayloadFresh(storedPayload, ceiling);
        if (isFresh) {
          result[code] = storedPayload;
          rememberPayload(code, storedPayload, true);
          continue;
        }
        storedFallbacks.set(code, storedPayload);
      }
      missingFromDb.push(code);
    }
  } catch (dbErr) {
    console.warn('DB check in getBatchMutualFundNavAction failed:', dbErr);
    missingFromDb.push(...missingFromRedis);
  }
  if (missingFromDb.length === 0) {
    return result;
  }
  await mapWithConcurrency(missingFromDb, NAV_BATCH_CONCURRENCY, async (code) => {
    const fallback = storedFallbacks.get(code);
    const maySync = !fallback || (await claimSyncSlot(code));
    if (maySync) {
      try {
        const upstream = await fetch(`${MF_URL}/${encodeURIComponent(code)}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(NAV_UPSTREAM_TIMEOUT_MS),
        });
        if (upstream.ok) {
          const payload = parseNavPayload(await upstream.json());
          if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
            result[code] = payload;
            rememberPayload(code, payload, true);
            // Same guard as the single-fetch path: never trade real history for
            // a shorter upstream response.
            if (!fallback || payload.data.length >= fallback.data.length) {
              try {
                const sql = getDb();
                await sql`
                  INSERT INTO mutual_fund_nav (scheme_code, payload, latest_nav_date, updated_at)
                  VALUES (
                    ${code},
                    ${JSON.stringify(payload)}::jsonb,
                    ${getLatestNavDateISO(payload)}::date,
                    NOW()
                  )
                  ON CONFLICT (scheme_code) DO UPDATE SET
                    payload = EXCLUDED.payload,
                    latest_nav_date = EXCLUDED.latest_nav_date,
                    updated_at = NOW()
                `;
              } catch (dbSyncErr) {
                console.warn(`DB sync for scheme ${code} failed:`, dbSyncErr);
              }
            }
            return;
          }
        }
      } catch (err) {
        console.warn(`AMFI sync for scheme ${code} failed:`, err);
      }
    }
    if (fallback) {
      result[code] = fallback;
      rememberPayload(code, fallback, true);
    }
  });
  return result;
}
