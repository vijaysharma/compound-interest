'use server';
import { ensureTables, getDb, IMF_URL, MF_URL } from '@/lib/db';
import { DEFAULT_EXCHANGE_RATES } from '@/data/default_exchange_rates';
import { DEFAULT_PPP_RECORDS } from '@/data/default_ppp_data';
import { redisGet, redisSet } from '@/lib/redis';
const OPEN_EXCHANGE_API = 'https://open.er-api.com/v6/latest';
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=400&mrv=1&gapfill=y';
const DB_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
// In-memory caches for fast warm responses
let memoryExchangeRates: { rates: Record<string, number>; timestamp: number } | null = null;
let memoryPppData: { data: unknown; timestamp: number } | null = null;
let memoryImfData: { data: unknown; timestamp: number } | null = null;
const mfSearchCache = new Map<string, { expiresAt: number; data: unknown[] }>();
const mfNavCache = new Map<string, { expiresAt: number; data: unknown }>();
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
        ? Date.now() - new Date(rows[0].updated_at).getTime() < DB_TTL_MS
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
  // 2. Redis cache check
  const redisCached = await redisGet<Array<{ schemeCode: number; schemeName: string }>>(
    'cache:mf:search:' + cacheKey
  );
  if (redisCached && Array.isArray(redisCached) && redisCached.length > 0) {
    mfSearchCache.set(cacheKey, { expiresAt: Date.now() + 10 * 60_000, data: redisCached });
    return redisCached;
  }
  // 3. Database query using pg_trgm GIN index (fast < 400ms)
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
  mfSearchCache.set(cacheKey, { expiresAt: Date.now() + 10 * 60_000, data });
  redisSet('cache:mf:search:' + cacheKey, data, 7200).catch(() => {});
  if (mfSearchCache.size > 200) {
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
  const parseNavPayload = (val: unknown): { data: unknown[]; [k: string]: unknown } | null => {
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
  };
  // 1. In-memory check first (0ms latency)
  const cached = mfNavCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now()) {
    const cachedNav = parseNavPayload(cached.data);
    if (cachedNav) {
      return cachedNav;
    }
  }
  // 2. Redis cache check (20-40ms)
  const redisNavRaw = await redisGet('cache:mf:nav:' + schemeCode);
  const redisNav = parseNavPayload(redisNavRaw);
  if (redisNav) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      data: redisNav,
    });
    return redisNav;
  }
  // 3. Check DB storage with strict freshness (2 hours TTL to avoid stale NAVs)
  const sql = getDb();
  let storedPayload: { data: unknown[]; [k: string]: unknown } | null = null;
  let isFresh = false;
  try {
    const stored = (await sql`
      SELECT payload, updated_at FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown; updated_at: string }>;
    if (stored.length > 0) {
      storedPayload = parseNavPayload(stored[0].payload);
      // NAV TTL: 2 hours freshness to prevent stale NAV data
      const NAV_FRESH_TTL_MS = 2 * 60 * 60 * 1000;
      isFresh =
        Boolean(storedPayload) &&
        Date.now() - new Date(stored[0].updated_at).getTime() < NAV_FRESH_TTL_MS;
    }
  } catch (err) {
    console.warn('DB query in getMutualFundNavAction failed:', err);
  }
  if (isFresh && storedPayload) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      data: storedPayload,
    });
    redisSet('cache:mf:nav:' + schemeCode, storedPayload, 7200).catch(() => {});
    return storedPayload;
  }
  // 4. Fetch upstream from api.mfapi.in (typically 200-350ms)
  try {
    const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (upstream.ok) {
      const payloadRaw = await upstream.json();
      const payload = parseNavPayload(payloadRaw);
      if (payload) {
        // Cache in memory immediately for fast subsequent access
        mfNavCache.set(schemeCode, {
          expiresAt: Date.now() + 5 * 60 * 1000,
          data: payload,
        });
        // Non-blocking asynchronous persistence to DB & Redis (doesn't delay user response!)
        sql`
          INSERT INTO mutual_fund_nav (scheme_code, payload, updated_at)
          VALUES (${schemeCode}, ${JSON.stringify(payload)}::jsonb, NOW())
          ON CONFLICT (scheme_code) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `.catch((persistErr) => {
          console.warn('Non-blocking NAV DB save failed:', persistErr);
        });
        redisSet('cache:mf:nav:' + schemeCode, payload, 7200).catch(() => {});
        return payload;
      }
    }
  } catch (fetchError) {
    console.warn('Upstream MF fetch failed, falling back to stored payload:', fetchError);
  }
  // 5. Fallback to stored payload if upstream is down
  if (storedPayload) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + 5 * 60 * 1000,
      data: storedPayload,
    });
    return storedPayload;
  }
  throw new Error('Failed to fetch mutual fund NAV data');
}
