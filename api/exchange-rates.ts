import { ensureTables, getDb, jsonResponse } from './_db';
import { DEFAULT_EXCHANGE_RATES } from '../src/data/default_exchange_rates';
export const config = {
  runtime: 'edge',
};
const OPEN_EXCHANGE_API = 'https://open.er-api.com/v6/latest';
const DB_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
export default async function handler(): Promise<Response> {
  let hasStored = false;
  let storedPayload: unknown = null;
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload, updated_at FROM inflation_sources WHERE source = 'exchange-rates'
    `) as Array<{ payload: { rates?: Record<string, number> }; updated_at: string }>;
    if (rows.length > 0 && rows[0].payload && rows[0].payload.rates) {
      hasStored = true;
      storedPayload = rows[0].payload;
      const isFresh = Date.now() - new Date(rows[0].updated_at).getTime() < DB_TTL_MS;
      if (isFresh) {
        return jsonResponse(rows[0].payload, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
      }
    }
  } catch (dbErr) {
    console.warn('DB read failed in exchange-rates handler:', dbErr);
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
        return jsonResponse(payload, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream exchange rates fetch failed:', fetchErr);
  }
  if (hasStored && storedPayload) {
    return jsonResponse(storedPayload, 200, 'public, s-maxage=300, stale-while-revalidate=3600');
  }
  return jsonResponse(
    { result: 'success', base_code: 'USD', rates: DEFAULT_EXCHANGE_RATES },
    200,
    'public, s-maxage=300, stale-while-revalidate=3600'
  );
}
