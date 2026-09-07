import { ensureTables, getDb, IMF_URL, jsonResponse } from './_db';
export const config = {
  runtime: 'edge',
};
export default async function handler(): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const rows = (await sql`
      SELECT payload FROM inflation_sources WHERE source = 'imf-pcpipch'
    `) as Array<{ payload: unknown }>;
    if (rows.length > 0 && rows[0].payload) {
      return jsonResponse(rows[0].payload, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
    }
  } catch (dbErr) {
    console.warn('DB read failed in imf-inflation handler, attempting upstream fetch:', dbErr);
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
        return jsonResponse(payload, 200, 'public, s-maxage=3600, stale-while-revalidate=86400');
      }
    }
  } catch (fetchErr) {
    console.warn('Upstream IMF fetch failed, returning fallback empty dataset:', fetchErr);
  }
  return jsonResponse({ values: { PCPIPCH: {} } }, 200, 'public, s-maxage=300, stale-while-revalidate=3600');
}
