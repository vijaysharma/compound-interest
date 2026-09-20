import { getDb, MF_URL } from '@/lib/db';
import { redisGet, redisSet } from '@/lib/redis';
import { getTodayISO, resolveDateRange } from '@/utilities/dateGuards';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  getLatestNavDateISO,
  mfNavCache,
  parseNavPayload,
} from './constants';
export async function handleGetMutualFundNav(
  schemeCodeRaw: string | number,
  requestedEndDate?: string | null
): Promise<unknown> {
  const schemeCode = String(schemeCodeRaw).trim();
  if (!/^\d{1,10}$/.test(schemeCode)) {
    throw new Error('Invalid scheme code. Must be numeric.');
  }
  const { endDate } = resolveDateRange(undefined, requestedEndDate);
  const today = getTodayISO();
  const cached = mfNavCache.get(schemeCode);
  if (cached) {
    const cachedNav = parseNavPayload(cached.data);
    if (cachedNav) {
      const latestDate = getLatestNavDateISO(cachedNav);
      if (latestDate && latestDate >= endDate) {
        return cachedNav;
      }
    }
  }
  const redisNavRaw = await redisGet('cache:mf:nav:' + schemeCode);
  const redisNav = parseNavPayload(redisNavRaw);
  if (redisNav) {
    const latestDate = getLatestNavDateISO(redisNav);
    if (latestDate && latestDate >= endDate) {
      mfNavCache.set(schemeCode, {
        expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
        data: redisNav,
      });
      return redisNav;
    }
  }
  let storedPayload: { data: unknown[]; [k: string]: unknown } | null = null;
  try {
    const sql = getDb();
    const stored = (await sql`
      SELECT payload FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown }>;
    if (stored.length > 0) {
      storedPayload = parseNavPayload(stored[0].payload);
      if (storedPayload) {
        const latestDate = getLatestNavDateISO(storedPayload);
        if (latestDate && latestDate >= endDate) {
          mfNavCache.set(schemeCode, {
            expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
            data: storedPayload,
          });
          redisSet('cache:mf:nav:' + schemeCode, storedPayload, NAV_CACHE_TTL_SECONDS).catch(() => {});
          return storedPayload;
        }
      }
    }
  } catch (dbErr) {
    console.warn('DB check in getMutualFundNavAction failed:', dbErr);
  }
  if (endDate <= today) {
    try {
      const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (upstream.ok) {
        const payloadRaw = await upstream.json();
        const payload = parseNavPayload(payloadRaw);
        if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
          try {
            const sql = getDb();
            await sql`
              INSERT INTO mutual_fund_nav (scheme_code, payload, updated_at)
              VALUES (${schemeCode}, ${JSON.stringify(payload)}::jsonb, NOW())
              ON CONFLICT (scheme_code) DO UPDATE SET
                payload = EXCLUDED.payload, updated_at = NOW()
            `;
          } catch (syncErr) {
            console.warn('DB sync in getMutualFundNavAction failed:', syncErr);
          }
          mfNavCache.set(schemeCode, {
            expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
            data: payload,
          });
          await redisSet('cache:mf:nav:' + schemeCode, payload, NAV_CACHE_TTL_SECONDS);
          return payload;
        }
      }
    } catch (fetchError) {
      console.warn('Upstream AMFI fetch failed:', fetchError);
    }
  }
  if (storedPayload) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
      data: storedPayload,
    });
    redisSet('cache:mf:nav:' + schemeCode, storedPayload, NAV_CACHE_TTL_SECONDS).catch(() => {});
    return storedPayload;
  }
  if (redisNav) {
    return redisNav;
  }
  throw new Error('Failed to fetch mutual fund NAV data');
}
