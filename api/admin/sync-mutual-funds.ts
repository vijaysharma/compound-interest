import { ensureTables, getDb, isAuthorized, jsonResponse, MF_URL, unauthorized } from '../_db.ts';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const upstream = await fetch(MF_URL, { headers: { Accept: 'application/json' } });
    if (!upstream.ok) return jsonResponse({ error: `MF API returned ${upstream.status}` }, 502);
    const payload = await upstream.json();
    if (!Array.isArray(payload))
      return jsonResponse({ error: 'MF API returned an invalid list' }, 502);
    const sql = getDb();
    await ensureTables(sql);
    await sql`DELETE FROM mutual_fund_schemes`;
    await sql`
      INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload)
      SELECT item->>'schemeCode', item->>'schemeName', item
      FROM jsonb_array_elements(${JSON.stringify(payload)}::jsonb) AS item
      WHERE item->>'schemeCode' IS NOT NULL AND item->>'schemeName' IS NOT NULL
      ON CONFLICT (scheme_code) DO UPDATE SET
        scheme_name = EXCLUDED.scheme_name, payload = EXCLUDED.payload, updated_at = NOW()
    `;
    return jsonResponse({ synced: payload.length });
  } catch (error) {
    return jsonResponse({ error: 'Failed to sync mutual funds', detail: String(error) }, 502);
  }
}
