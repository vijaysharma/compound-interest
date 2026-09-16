'use server';
import { ensureTables, getDb, IMF_URL, MF_URL } from '@/lib/db';
import { DEFAULT_EXCHANGE_RATES } from '@/data/default_exchange_rates';
import { DEFAULT_PPP_RECORDS } from '@/data/default_ppp_data';
import { redisGet, redisMGet, redisSet } from '@/lib/redis';
const OPEN_EXCHANGE_API = 'https://open.er-api.com/v6/latest';
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=400&mrv=1&gapfill=y';
const DB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PPP_DB_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days for PPP data
// Long-lived TTL constants for instant retrieval
const NAV_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days in Redis
const NAV_IN_MEMORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in server instance memory
const SEARCH_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days in Redis
const SEARCH_IN_MEMORY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in memory
// In-memory caches for fast warm responses
let memoryExchangeRates: { rates: Record<string, number>; timestamp: number } | null = null;
let memoryPppData: { data: unknown; timestamp: number } | null = null;
let memoryImfData: { data: unknown; timestamp: number } | null = null;
const mfSearchCache = new Map<string, { expiresAt: number; data: unknown[] }>();
const mfNavCache = new Map<string, { expiresAt: number; data: unknown }>();
function parseNavPayload(val: unknown): { data: unknown[]; [k: string]: unknown } | null {
  if (!val) return null;
  let parsed = val;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown }).data)) {
    return parsed as { data: unknown[]; [k: string]: unknown };
  }
  return null;
}
export async function getExchangeRatesAction(): Promise<{
  result: string;
  base_code: string;
  rates: Record<string, number>;
}> {
  const redisRates = await redisGet<Record<string, number>>('cache:rates:usd');
  if (redisRates) {
    return {
      result: 'success',
      base_code: 'USD',
      rates: redisRates,
    };
  }
  if (memoryExchangeRates && Date.now() - memoryExchangeRates.timestamp < 10 * 60 * 1000) {
    return {
      result: 'success',
      base_code: 'USD',
      rates: memoryExchangeRates.rates,
    };
  }
  let storedPayload: { rates?: Record<string, number> } | null = null;
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload, updated_at FROM inflation_sources WHERE source = 'exchange-rates'
    `) as Array<{ payload: { rates?: Record<string, number> }; updated_at: string }>;
    if (rows.length > 0 && rows[0].payload && rows[0].payload.rates) {
      storedPayload = rows[0].payload;
      const isFresh = Date.now() - new Date(rows[0].updated_at).getTime() < DB_TTL_MS;
      if (isFresh) {
        memoryExchangeRates = { rates: rows[0].payload.rates, timestamp: Date.now() };
        redisSet('cache:rates:usd', rows[0].payload.rates, 21600).catch(() => {});
        return {
          result: 'success',
          base_code: 'USD',
          rates: rows[0].payload.rates,
        };
      }
    }
  } catch (dbErr) {
    console.warn('DB read failed in getExchangeRatesAction:', dbErr);
  }
  try {
    const upstream = await fetch(OPEN_EXCHANGE_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (upstream.ok) {
      const payload = (await upstream.json()) as { rates?: Record<string, number> };
      if (payload && payload.rates && typeof payload.rates === 'object') {
        try {
          const sql = getDb();
          await sql`
            INSERT INTO inflation_sources (source, payload, updated_at)
            VALUES ('exchange-rates', ${JSON.stringify(payload)}::jsonb, NOW())
            ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
        } catch {
          // DB persistence failure is non-fatal
        }
        memoryExchangeRates = { rates: payload.rates, timestamp: Date.now() };
        redisSet('cache:rates:usd', payload.rates, 21600).catch(() => {});
        return {
          result: 'success',
          base_code: 'USD',
          rates: payload.rates,
        };
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream exchange rates fetch failed:', fetchErr);
  }
  if (storedPayload && storedPayload.rates) {
    redisSet('cache:rates:usd', storedPayload.rates, 21600).catch(() => {});
    return {
      result: 'success',
      base_code: 'USD',
      rates: storedPayload.rates,
    };
  }
  return {
    result: 'success',
    base_code: 'USD',
    rates: DEFAULT_EXCHANGE_RATES,
  };
}
export async function getPPPDataAction(): Promise<unknown> {
  const redisPpp = await redisGet('cache:ppp:worldbank');
  if (redisPpp) {
    return redisPpp;
  }
  if (memoryPppData && Date.now() - memoryPppData.timestamp < 30 * 60 * 1000) {
    return memoryPppData.data;
  }
  let storedPayload: unknown = null;
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload, updated_at FROM inflation_sources WHERE source = 'world-bank-ppp'
    `) as Array<{ payload: unknown; updated_at?: string }>;
    if (rows.length > 0 && rows[0].payload) {
      storedPayload = rows[0].payload;
      const isFresh = rows[0].updated_at
        ? Date.now() - new Date(rows[0].updated_at).getTime() < PPP_DB_TTL_MS
        : false;
      if (isFresh) {
        memoryPppData = { data: rows[0].payload, timestamp: Date.now() };
        redisSet('cache:ppp:worldbank', rows[0].payload, 86400 * 7).catch(() => {});
        return rows[0].payload;
      }
    }
  } catch (dbErr) {
    console.warn('DB read failed in getPPPDataAction:', dbErr);
  }
  try {
    const upstream = await fetch(WORLD_BANK_PPP_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (upstream.ok) {
      const payload = await upstream.json();
      if (
        Array.isArray(payload) &&
        payload.length > 1 &&
        Array.isArray(payload[1]) &&
        payload[1].length > 0
      ) {
        try {
          const sql = getDb();
          await sql`
            INSERT INTO inflation_sources (source, payload, updated_at)
            VALUES ('world-bank-ppp', ${JSON.stringify(payload)}::jsonb, NOW())
            ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
        } catch {
          // DB persistence failure is non-fatal
        }
        memoryPppData = { data: payload, timestamp: Date.now() };
        redisSet('cache:ppp:worldbank', payload, 86400 * 7).catch(() => {});
        return payload;
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream World Bank PPP fetch failed, falling back to default:', fetchErr);
  }
  if (storedPayload) {
    redisSet('cache:ppp:worldbank', storedPayload, 86400 * 7).catch(() => {});
    return storedPayload;
  }
  return DEFAULT_PPP_RECORDS;
}
export async function getIMFInflationAction(): Promise<unknown> {
  const redisImf = await redisGet('cache:inflation:imf');
  if (redisImf) {
    return redisImf;
  }
  if (memoryImfData && Date.now() - memoryImfData.timestamp < 30 * 60 * 1000) {
    return memoryImfData.data;
  }
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload FROM inflation_sources WHERE source = 'imf-pcpipch'
    `) as Array<{ payload: unknown }>;
    if (rows.length > 0 && rows[0].payload) {
      memoryImfData = { data: rows[0].payload, timestamp: Date.now() };
      redisSet('cache:inflation:imf', rows[0].payload, 86400 * 7).catch(() => {});
      return rows[0].payload;
    }
  } catch (dbErr) {
    console.warn('DB read failed in getIMFInflationAction:', dbErr);
  }
  try {
    const upstream = await fetch(IMF_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (upstream.ok) {
      const payload = await upstream.json();
      if (payload && typeof payload === 'object') {
        try {
          const sql = getDb();
          await sql`
            INSERT INTO inflation_sources (source, payload)
            VALUES ('imf-pcpipch', ${JSON.stringify(payload)}::jsonb)
            ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
        } catch {
          // DB persistence failure is non-fatal
        }
        memoryImfData = { data: payload, timestamp: Date.now() };
        redisSet('cache:inflation:imf', payload, 86400 * 7).catch(() => {});
        return payload;
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream IMF fetch failed, returning empty estimates:', fetchErr);
  }
  return { values: { PCPIPCH: {} } };
}
export async function searchMutualFundsAction(
  searchQuery = ''
): Promise<Array<{ schemeCode: number; schemeName: string }>> {
  const rawSearch = searchQuery.trim();
  const search = rawSearch.replace(/[%_\\]/g, ' ').trim().slice(0, 80);
  const cacheKey = search.toLowerCase();
  // 1. In-memory check first (0ms latency)
  const cached = mfSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as Array<{ schemeCode: number; schemeName: string }>;
  }
  // 2. Redis cache check (20-30ms) - cached for 30 days
  const redisCached = await redisGet<Array<{ schemeCode: number; schemeName: string }>>(
    'cache:mf:search:' + cacheKey
  );
  if (redisCached && Array.isArray(redisCached) && redisCached.length > 0) {
    mfSearchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_IN_MEMORY_TTL_MS, data: redisCached });
    return redisCached;
  }
  // 3. Database query using index
  const sql = getDb();
  const searchPatterns = search
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((term) => `%${term}%`);
  const rows = (await sql`
    SELECT scheme_code, scheme_name FROM mutual_fund_schemes
    WHERE ${searchPatterns.length === 0} OR scheme_name ILIKE ALL(${searchPatterns})
    ORDER BY scheme_name ASC
    LIMIT 200
  `) as Array<{ scheme_code: string; scheme_name: string }>;
  const data = rows.map((row) => ({
    schemeCode: Number(row.scheme_code),
    schemeName: row.scheme_name,
  }));
  mfSearchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_IN_MEMORY_TTL_MS, data });
  redisSet('cache:mf:search:' + cacheKey, data, SEARCH_CACHE_TTL_SECONDS).catch(() => {});
  if (mfSearchCache.size > 1000) {
    const oldest = mfSearchCache.keys().next().value;
    if (oldest) mfSearchCache.delete(oldest);
  }
  return data;
}
export async function getMutualFundNavAction(schemeCodeRaw: string | number): Promise<unknown> {
  const schemeCode = String(schemeCodeRaw).trim();
  if (!/^\d{1,10}$/.test(schemeCode)) {
    throw new Error('Invalid scheme code. Must be numeric.');
  }
  // 1. In-memory check first (0ms latency)
  const cached = mfNavCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now()) {
    const cachedNav = parseNavPayload(cached.data);
    if (cachedNav) {
      return cachedNav;
    }
  }
  // 2. Redis cache check (10-30ms) - cached for 30 days
  const redisNavRaw = await redisGet('cache:mf:nav:' + schemeCode);
  const redisNav = parseNavPayload(redisNavRaw);
  if (redisNav) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
      data: redisNav,
    });
    return redisNav;
  }
  // 3. Fast upstream fetch from AMFI official CDN (300-500ms)
  try {
    const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (upstream.ok) {
      const payloadRaw = await upstream.json();
      const payload = parseNavPayload(payloadRaw);
      if (payload) {
        mfNavCache.set(schemeCode, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: payload,
        });
        await redisSet('cache:mf:nav:' + schemeCode, payload, NAV_CACHE_TTL_SECONDS);
        return payload;
      }
    }
  } catch (fetchError) {
    console.warn('Upstream MF fetch failed:', fetchError);
  }
  // 4. Fallback: check PostgreSQL mutual_fund_nav if upstream was temporarily unreachable
  try {
    const sql = getDb();
    const stored = (await sql`
      SELECT payload FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown }>;
    if (stored.length > 0) {
      const storedPayload = parseNavPayload(stored[0].payload);
      if (storedPayload) {
        mfNavCache.set(schemeCode, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: storedPayload,
        });
        redisSet('cache:mf:nav:' + schemeCode, storedPayload, NAV_CACHE_TTL_SECONDS).catch(() => {});
        return storedPayload;
      }
    }
  } catch (dbErr) {
    console.warn('Fallback DB read failed in getMutualFundNavAction:', dbErr);
  }
  throw new Error('Failed to fetch mutual fund NAV data');
}
export async function getBatchMutualFundNavAction(
  schemeCodesRaw: (string | number)[]
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
  // 1. In-memory check (0ms)
  const missingFromMemory: string[] = [];
  for (const code of validCodes) {
    const cached = mfNavCache.get(code);
    if (cached && cached.expiresAt > Date.now()) {
      const parsed = parseNavPayload(cached.data);
      if (parsed) {
        result[code] = parsed;
        continue;
      }
    }
    missingFromMemory.push(code);
  }
  if (missingFromMemory.length === 0) {
    return result;
  }
  // 2. Redis batch check with redisMGet pipeline (10-30ms)
  const redisKeys = missingFromMemory.map((code) => 'cache:mf:nav:' + code);
  const redisResults = await redisMGet<unknown>(redisKeys);
  const missingFromRedis: string[] = [];
  for (const code of missingFromMemory) {
    const raw = redisResults['cache:mf:nav:' + code];
    const parsed = parseNavPayload(raw);
    if (parsed) {
      result[code] = parsed;
      mfNavCache.set(code, {
        expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
        data: parsed,
      });
    } else {
      missingFromRedis.push(code);
    }
  }
  if (missingFromRedis.length === 0) {
    return result;
  }
  // 3. Parallel upstream fetch for schemes missing from Redis
  await Promise.all(
    missingFromRedis.map(async (code) => {
      try {
        const upstream = await fetch(`${MF_URL}/${encodeURIComponent(code)}`, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(6000),
        });
        if (upstream.ok) {
          const payloadRaw = await upstream.json();
          const payload = parseNavPayload(payloadRaw);
          if (payload) {
            result[code] = payload;
            mfNavCache.set(code, {
              expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
              data: payload,
            });
            await redisSet('cache:mf:nav:' + code, payload, NAV_CACHE_TTL_SECONDS);
          }
        }
      } catch (err) {
        console.warn(`Upstream fetch for scheme ${code} failed:`, err);
      }
    })
  );
  return result;
}
