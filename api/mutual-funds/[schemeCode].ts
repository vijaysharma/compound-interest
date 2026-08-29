import { ensureTables, getDb, jsonResponse, MF_URL } from '../_db.ts';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  const schemeCode = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');
  if (!schemeCode) return jsonResponse({ error: 'Scheme code is required' }, 400);
  try {
    const sql = getDb();
    await ensureTables(sql);
    const stored = (await sql`
      SELECT payload FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown }>;
    if (stored.length > 0) return jsonResponse(stored[0].payload);
    const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`);
    if (!upstream.ok) return jsonResponse({ error: `MF API returned ${upstream.status}` }, 502);
    const payload = await upstream.json();
    await sql`
      INSERT INTO mutual_fund_nav (scheme_code, payload)
      VALUES (${schemeCode}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (scheme_code) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
    return jsonResponse(payload);
  } catch (error) {
    return jsonResponse({ error: 'Failed to read mutual fund data', detail: String(error) }, 503);
  }
}
