import { ensureTables, getDb, jsonResponse, MF_URL } from '../_db';
export const config = { runtime: 'edge' };
const navCache = new Map<string, { expiresAt: number; data: unknown }>();
const NAV_MEMORY_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory Edge cache
const DB_NAV_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours Postgres DB TTL
export default async function handler(request: Request): Promise<Response> {
  const schemeCode = decodeURIComponent(new URL(request.url).pathname.split('/').pop() ?? '');
  if (!schemeCode) return jsonResponse({ error: 'Scheme code is required' }, 400);
  try {
    // 1. Check in-memory Edge worker cache
    const cached = navCache.get(schemeCode);
    if (cached && cached.expiresAt > Date.now()) {
      return jsonResponse(cached.data);
    }
    const sql = getDb();
    await ensureTables(sql);
    // 2. Query Postgres database with updated_at timestamp
    const stored = (await sql`
      SELECT payload, updated_at FROM mutual_fund_nav WHERE scheme_code = ${schemeCode}
    `) as Array<{ payload: unknown; updated_at: string }>;
    const hasStored = stored.length > 0;
    const isFresh =
      hasStored && Date.now() - new Date(stored[0].updated_at).getTime() < DB_NAV_TTL_MS;
    // If database record exists and is fresh (< 6 hours old), serve directly (0 upstream calls)
    if (isFresh) {
      navCache.set(schemeCode, {
        expiresAt: Date.now() + NAV_MEMORY_TTL_MS,
        data: stored[0].payload,
      });
      return jsonResponse(stored[0].payload);
    }
    // 3. Stale or missing: Fetch from upstream AMFI/mfapi
    try {
      const upstream = await fetch(`${MF_URL}/${encodeURIComponent(schemeCode)}`);
      if (upstream.ok) {
        const payload = await upstream.json();
        await sql`
          INSERT INTO mutual_fund_nav (scheme_code, payload, updated_at)
          VALUES (${schemeCode}, ${JSON.stringify(payload)}::jsonb, NOW())
          ON CONFLICT (scheme_code) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
        `;
        navCache.set(schemeCode, {
          expiresAt: Date.now() + NAV_MEMORY_TTL_MS,
          data: payload,
        });
        return jsonResponse(payload);
      }
    } catch (fetchError) {
      console.warn('Upstream MF fetch failed, checking fallback:', fetchError);
    }
    // 4. Graceful Fallback: If upstream call failed but we have a stored DB record, return it
    if (hasStored) {
      navCache.set(schemeCode, {
        expiresAt: Date.now() + NAV_MEMORY_TTL_MS,
        data: stored[0].payload,
      });
      return jsonResponse(stored[0].payload);
    }
    return jsonResponse({ error: 'Failed to fetch mutual fund NAV data from upstream' }, 502);
  } catch (error) {
    return jsonResponse({ error: 'Failed to read mutual fund data', detail: String(error) }, 503);
  }
}
