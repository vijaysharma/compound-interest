import { getDb, MF_URL } from '@/lib/db';
import { redisMGet, redisSet } from '@/lib/redis';
import { getTodayISO, resolveDateRange } from '@/utilities/dateGuards';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  getLatestNavDateISO,
  mfNavCache,
  parseNavPayload,
} from './constants';
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
  const today = getTodayISO();
  const missingFromMemory: string[] = [];
  for (const code of validCodes) {
    const cached = mfNavCache.get(code);
    if (cached) {
      const parsed = parseNavPayload(cached.data);
      if (parsed) {
        const latestDate = getLatestNavDateISO(parsed);
        if (latestDate && latestDate >= endDate) {
          result[code] = parsed;
          continue;
        }
      }
    }
    missingFromMemory.push(code);
  }
  if (missingFromMemory.length === 0) {
    return result;
  }
  const redisKeys = missingFromMemory.map((code) => 'cache:mf:nav:' + code);
  const redisResults = await redisMGet<unknown>(redisKeys);
  const missingFromRedis: string[] = [];
  for (const code of missingFromMemory) {
    const raw = redisResults['cache:mf:nav:' + code];
    const parsed = parseNavPayload(raw);
    if (parsed) {
      const latestDate = getLatestNavDateISO(parsed);
      if (latestDate && latestDate >= endDate) {
        result[code] = parsed;
        mfNavCache.set(code, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: parsed,
        });
        continue;
      }
    }
    missingFromRedis.push(code);
  }
  if (missingFromRedis.length === 0) {
    return result;
  }
  const missingFromDb: string[] = [];
  try {
    const sql = getDb();
    const stored = (await sql`
      SELECT scheme_code, payload FROM mutual_fund_nav WHERE scheme_code = ANY(${missingFromRedis})
    `) as Array<{ scheme_code: string; payload: unknown }>;
    const storedMap = new Map<string, { data: unknown[]; [k: string]: unknown }>();
    for (const row of stored) {
      const parsed = parseNavPayload(row.payload);
      if (parsed) storedMap.set(row.scheme_code, parsed);
    }
    for (const code of missingFromRedis) {
      const storedPayload = storedMap.get(code);
      if (storedPayload) {
        const latestDate = getLatestNavDateISO(storedPayload);
        if (latestDate && latestDate >= endDate) {
          result[code] = storedPayload;
          mfNavCache.set(code, {
            expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
            data: storedPayload,
          });
          redisSet('cache:mf:nav:' + code, storedPayload, NAV_CACHE_TTL_SECONDS).catch(() => {});
          continue;
        }
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
  if (endDate <= today) {
    await Promise.all(
      missingFromDb.map(async (code) => {
        try {
          const upstream = await fetch(`${MF_URL}/${encodeURIComponent(code)}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(15000),
          });
          if (upstream.ok) {
            const payloadRaw = await upstream.json();
            const payload = parseNavPayload(payloadRaw);
            if (payload && Array.isArray(payload.data) && payload.data.length > 0) {
              result[code] = payload;
              mfNavCache.set(code, {
                expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
                data: payload,
              });
              await redisSet('cache:mf:nav:' + code, payload, NAV_CACHE_TTL_SECONDS);
              try {
                const sql = getDb();
                await sql`
                  INSERT INTO mutual_fund_nav (scheme_code, payload, updated_at)
                  VALUES (${code}, ${JSON.stringify(payload)}::jsonb, NOW())
                  ON CONFLICT (scheme_code) DO UPDATE SET
                    payload = EXCLUDED.payload, updated_at = NOW()
                `;
              } catch (dbSyncErr) {
                console.warn(`DB sync for scheme ${code} failed:`, dbSyncErr);
              }
            }
          }
        } catch (err) {
          console.warn(`AMFI sync for scheme ${code} failed:`, err);
        }
      })
    );
  }
  return result;
}
