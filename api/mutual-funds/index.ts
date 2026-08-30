import { ensureTables, getDb, jsonResponse } from '../_db.ts';
export const config = { runtime: 'edge' };
const searchCache = new Map<string, { expiresAt: number; data: unknown[] }>();
const SEARCH_CACHE_TTL_MS = 60_000;
const MAX_SEARCH_CACHE_ENTRIES = 100;
export default async function handler(request: Request): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const search = new URL(request.url).searchParams.get('q')?.trim() ?? '';
    const cacheKey = search.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return jsonResponse(cached.data);
    }
    const searchPatterns = search
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `%${term}%`);
    const rows = (await sql`
      SELECT scheme_code, scheme_name FROM mutual_fund_schemes
      WHERE ${searchPatterns.length === 0} OR scheme_name ILIKE ALL(${searchPatterns})
      ORDER BY scheme_name ASC
      LIMIT 1000
    `) as Array<{ scheme_code: string; scheme_name: string }>;
    const data = rows.map((row) => ({
      schemeCode: Number(row.scheme_code),
      schemeName: row.scheme_name,
    }));
    searchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, data });
    if (searchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) searchCache.delete(oldestKey);
    }
    return jsonResponse(data);
  } catch (error) {
    return jsonResponse({ error: 'Failed to read mutual funds', detail: String(error) }, 503);
  }
}
