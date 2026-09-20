import { ensureTables, getDb, IMF_URL } from '@/lib/db';
import { DEFAULT_PPP_RECORDS } from '@/data/default_ppp_data';
import { redisGet, redisSet } from '@/lib/redis';
import { PPP_DB_TTL_MS, WORLD_BANK_PPP_API, memoryState } from './constants';
export async function handleGetPPPData(): Promise<unknown> {
  const redisPpp = await redisGet('cache:ppp:worldbank');
  if (redisPpp) {
    return redisPpp;
  }
  if (memoryState.pppData && Date.now() - memoryState.pppData.timestamp < 30 * 60 * 1000) {
    return memoryState.pppData.data;
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
        memoryState.pppData = { data: rows[0].payload, timestamp: Date.now() };
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
        memoryState.pppData = { data: payload, timestamp: Date.now() };
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
export async function handleGetIMFInflation(): Promise<unknown> {
  const redisImf = await redisGet('cache:inflation:imf');
  if (redisImf) {
    return redisImf;
  }
  if (memoryState.imfData && Date.now() - memoryState.imfData.timestamp < 30 * 60 * 1000) {
    return memoryState.imfData.data;
  }
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload FROM inflation_sources WHERE source = 'imf-pcpipch'
    `) as Array<{ payload: unknown }>;
    if (rows.length > 0 && rows[0].payload) {
      memoryState.imfData = { data: rows[0].payload, timestamp: Date.now() };
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
        memoryState.imfData = { data: payload, timestamp: Date.now() };
        redisSet('cache:inflation:imf', payload, 86400 * 7).catch(() => {});
        return payload;
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream IMF fetch failed, returning empty estimates:', fetchErr);
  }
  return { values: { PCPIPCH: {} } };
}
