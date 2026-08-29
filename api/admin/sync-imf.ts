import { ensureTables, getDb, isAuthorized, jsonResponse, unauthorized } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return jsonResponse({ error: 'IMF payload must be a JSON object' }, 400);
    }
    const sql = getDb();
    await ensureTables(sql);
    await sql`
      INSERT INTO inflation_sources (source, payload)
      VALUES ('imf-pcpipch', ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (source) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `;
    return jsonResponse({ synced: true });
  } catch (error) {
    return jsonResponse({ error: 'Failed to sync IMF JSON', detail: String(error) }, 400);
  }
}
