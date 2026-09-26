import { getDb } from '../db';
import { redisSet } from '../redis';
import type { AmfiNavRecord } from './amfiNavTypes';
export async function checkDateExistsInDb(isoDate: string): Promise<number> {
  const sql = getDb();
  try {
    const res = (await sql`
      SELECT count(*) AS count FROM mutual_fund_nav WHERE date = ${isoDate}::date
    `) as Array<{ count: string | number }>;
    return Number(res[0]?.count ?? 0);
  } catch {
    return 0;
  }
}
export async function upsertWhitelistedNavBatch(records: AmfiNavRecord[], batchSize = 5000): Promise<number> {
  if (records.length === 0) return 0;
  const sql = getDb();
  let totalProcessed = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const rawChunk = records.slice(i, i + batchSize);
    const dedupedMap = new Map<string, { scheme_code: string; date: string; nav: number }>();
    for (const r of rawChunk) {
      const key = `${r.schemeCode}_${r.date}`;
      dedupedMap.set(key, { scheme_code: r.schemeCode, date: r.date, nav: r.nav });
    }
    const cleanChunk = Array.from(dedupedMap.values());
    if (cleanChunk.length === 0) continue;
    await sql`
      INSERT INTO mutual_fund_nav (scheme_code, date, nav, updated_at)
      SELECT x.scheme_code, x.date::date, x.nav::numeric, NOW()
      FROM jsonb_to_recordset(${JSON.stringify(cleanChunk)}::jsonb) AS x(
        scheme_code VARCHAR(20),
        date TEXT,
        nav NUMERIC
      )
      ON CONFLICT (scheme_code, date) DO NOTHING
    `;
    totalProcessed += cleanChunk.length;
  }
  return totalProcessed;
}
export async function updateRedisNavCache(records: AmfiNavRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const latestByScheme: Record<string, { nav: number; date: string; schemeName: string }> = {};
  for (const r of records) {
    const existing = latestByScheme[r.schemeCode];
    if (!existing || r.date > existing.date) {
      latestByScheme[r.schemeCode] = { nav: r.nav, date: r.date, schemeName: r.schemeName };
    }
  }
  const count = Object.keys(latestByScheme).length;
  try {
    await redisSet('nav:latest:map', latestByScheme, 7 * 24 * 3600);
  } catch {
    // Continue on Redis error
  }
  return count;
}
