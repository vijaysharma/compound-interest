import { ensureTables, getDb, isAuthorized, jsonResponse, unauthorized } from '../_db';
export const config = { runtime: 'edge' };
const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=300&mrv=1';
export default async function handler(request: Request): Promise<Response> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorized(request, sql))) return unauthorized();
  try {
    let payload: unknown = null;
    // Check if JSON body was provided by the admin
    const text = await request.text();
    if (text && text.trim()) {
      try {
        payload = JSON.parse(text);
      } catch {
        return jsonResponse({ error: 'Provided PPP payload must be valid JSON' }, 400);
      }
    }
    // If no body provided, perform automated server-side fetch from World Bank
    if (!payload) {
      const upstream = await fetch(WORLD_BANK_PPP_API, {
        headers: { Accept: 'application/json' },
      });
      if (!upstream.ok) {
        return jsonResponse({ error: `World Bank API returned ${upstream.status}` }, 502);
      }
      payload = await upstream.json();
    }
    if (!payload || typeof payload !== 'object') {
      return jsonResponse({ error: 'Invalid PPP payload format' }, 400);
    }
    await sql`
      INSERT INTO inflation_sources (source, payload)
      VALUES ('world-bank-ppp', ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
    // Calculate synced records count if possible
    let count = 0;
    if (Array.isArray(payload)) {
      if (Array.isArray(payload[1])) {
        count = payload[1].length;
      } else {
        count = payload.length;
      }
    }
    return jsonResponse({ synced: count || true });
  } catch (error) {
    return jsonResponse(
      { error: 'Failed to sync World Bank PPP data', detail: String(error) },
      500
    );
  }
}
