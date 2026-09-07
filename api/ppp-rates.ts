import { ensureTables, getDb, jsonResponse } from './_db';
import { DEFAULT_PPP_RECORDS } from '../src/data/default_ppp_data';
export const config = {
  runtime: 'edge',
};
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=300&mrv=1';
export default async function handler(): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload FROM inflation_sources WHERE source = 'world-bank-ppp'
    `) as Array<{ payload: unknown }>;
    if (rows.length > 0 && rows[0].payload) {
      return jsonResponse(rows[0].payload, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
    }
  } catch (dbErr) {
    console.warn('DB read failed in ppp-rates handler, attempting upstream fetch:', dbErr);
  }
  try {
    const upstream = await fetch(WORLD_BANK_PPP_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (upstream.ok) {
      const payload = await upstream.json();
      if (Array.isArray(payload) && payload.length > 1 && Array.isArray(payload[1]) && payload[1].length > 0) {
        try {
          const sql = getDb();
          await sql`
            INSERT INTO inflation_sources (source, payload)
            VALUES ('world-bank-ppp', ${JSON.stringify(payload)}::jsonb)
            ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
          `;
        } catch {
          // DB persistence failure is non-fatal
        }
        return jsonResponse(payload, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream World Bank PPP fetch failed, falling back to bundled dataset:', fetchErr);
  }
  return jsonResponse(DEFAULT_PPP_RECORDS, 200, 'public, s-maxage=300, stale-while-revalidate=3600');
}
