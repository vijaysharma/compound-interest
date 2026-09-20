import { getDb } from '@/lib/db';
import { redisGet, redisSet } from '@/lib/redis';
import {
  SEARCH_CACHE_TTL_SECONDS,
  SEARCH_IN_MEMORY_TTL_MS,
  mfSearchCache,
} from './constants';
export async function handleSearchMutualFunds(
  searchQuery = ''
): Promise<Array<{ schemeCode: number; schemeName: string }>> {
  const rawSearch = searchQuery.trim();
  const search = rawSearch.replace(/[%_\\]/g, ' ').trim().slice(0, 80);
  const cacheKey = search.toLowerCase();
  const cached = mfSearchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as Array<{ schemeCode: number; schemeName: string }>;
  }
  const redisCached = await redisGet<Array<{ schemeCode: number; schemeName: string }>>(
    'cache:mf:search:' + cacheKey
  );
  if (redisCached && Array.isArray(redisCached) && redisCached.length > 0) {
    mfSearchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_IN_MEMORY_TTL_MS, data: redisCached });
    return redisCached;
  }
  const allSchemesRedis = await redisGet<Array<{ schemeCode: number; schemeName: string }>>('cache:mf:all_schemes');
  if (allSchemesRedis && Array.isArray(allSchemesRedis) && allSchemesRedis.length > 0) {
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    const filtered = allSchemesRedis
      .filter((s) => terms.every((t) => s.schemeName.toLowerCase().includes(t)))
      .slice(0, 200);
    mfSearchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_IN_MEMORY_TTL_MS, data: filtered });
    redisSet('cache:mf:search:' + cacheKey, filtered, SEARCH_CACHE_TTL_SECONDS).catch(() => {});
    return filtered;
  }
  const sql = getDb();
  const searchPatterns = search
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((term) => `%${term}%`);
  const rows = (await sql`
    SELECT scheme_code, scheme_name FROM mutual_fund_schemes
    WHERE ${searchPatterns.length === 0} OR scheme_name ILIKE ALL(${searchPatterns})
    ORDER BY scheme_name ASC
    LIMIT 200
  `) as Array<{ scheme_code: string; scheme_name: string }>;
  const data = rows.map((row) => ({
    schemeCode: Number(row.scheme_code),
    schemeName: row.scheme_name,
  }));
  mfSearchCache.set(cacheKey, { expiresAt: Date.now() + SEARCH_IN_MEMORY_TTL_MS, data });
  redisSet('cache:mf:search:' + cacheKey, data, SEARCH_CACHE_TTL_SECONDS).catch(() => {});
  if (mfSearchCache.size > 1000) {
    const oldest = mfSearchCache.keys().next().value;
    if (oldest) mfSearchCache.delete(oldest);
  }
  return data;
}
