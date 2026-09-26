import { getDb } from '../db';
import { redisSet } from '../redis';
import { navPayloadKey } from '@/actions/data/constants';
import { parseAnyDate } from '@/utilities/dateUtils';
import type { AmfiNavRecord } from './amfiNavTypes';
import { isSchemeTracked, registerTrackedScheme } from './trackedSchemes';
import { upsertWhitelistedNavBatch, updateRedisNavCache } from './amfiNavStorage';
interface MfApiResponse {
  status?: string;
  meta?: {
    scheme_code?: number | string;
    scheme_name?: string;
    fund_house?: string;
  };
  data?: Array<{ date: string; nav: string }>;
}
function toIsoDate(ddMmYyyy: string): string | null {
  const d = parseAnyDate(ddMmYyyy);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
export async function backfillSchemeHistory(
  schemeCode: string,
  schemeNameFallback = `Scheme ${schemeCode}`
): Promise<number> {
  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) return 0;
  const json = (await res.json()) as MfApiResponse;
  const meta = json.meta;
  const rows = json.data ?? [];
  if (rows.length === 0) return 0;
  const schemeName = meta?.scheme_name || schemeNameFallback;
  const records: AmfiNavRecord[] = [];
  for (const r of rows) {
    const iso = toIsoDate(r.date);
    const navVal = parseFloat(r.nav);
    if (iso && Number.isFinite(navVal) && navVal > 0) {
      records.push({ schemeCode, schemeName, nav: navVal, date: iso });
    }
  }
  const inserted = await upsertWhitelistedNavBatch(records, 5000);
  await updateRedisNavCache(records);
  const payload = { meta: { scheme_code: schemeCode, scheme_name: schemeName }, data: rows };
  await redisSet(navPayloadKey(schemeCode), payload, 7 * 24 * 3600).catch(() => {});
  return inserted;
}
export async function ensureSchemeTrackedAndBackfilled(schemeCode: string): Promise<boolean> {
  const cleanCode = String(schemeCode).trim();
  const tracked = await isSchemeTracked(cleanCode);
  const sql = getDb();
  if (tracked) {
    const existing = (await sql`
      SELECT count(*) as count FROM mutual_fund_nav WHERE scheme_code = ${cleanCode} LIMIT 1
    `) as Array<{ count: string | number }>;
    if (Number(existing[0]?.count ?? 0) > 0) return true;
  }
  let schemeName = `Scheme ${cleanCode}`;
  let amfiName: string | null = null;
  const lookup = (await sql`
    SELECT scheme_name, payload FROM mutual_fund_schemes WHERE scheme_code = ${cleanCode} LIMIT 1
  `) as Array<{ scheme_name: string; payload?: { fund_house?: string } }>;
  if (lookup.length > 0) {
    schemeName = lookup[0].scheme_name;
    amfiName = lookup[0].payload?.fund_house ?? null;
  }
  await registerTrackedScheme(cleanCode, schemeName, amfiName);
  await backfillSchemeHistory(cleanCode, schemeName);
  return true;
}
