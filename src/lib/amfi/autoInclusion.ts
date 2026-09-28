import { getDb } from '../db';
import { redisSet } from '../redis';
import { NAV_IN_MEMORY_TTL_MS, mfNavCache, navPayloadKey } from '@/actions/data/constants';
import { latestNavDateIn } from '@/utilities/navCalendar';
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
  const cleanCode = String(schemeCode).trim();
  const numCode = Number(cleanCode);
  if (!Number.isFinite(numCode) || numCode <= 0) return 0;
  const url = `https://api.mfapi.in/mf/${cleanCode}`;
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
      records.push({ schemeCode: cleanCode, schemeName, nav: navVal, date: iso });
    }
  }
  const inserted = await upsertWhitelistedNavBatch(records, 5000);
  await updateRedisNavCache(records);
  const payload = { meta: { scheme_code: cleanCode, scheme_name: schemeName }, data: rows };
  mfNavCache.set(cleanCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
    latest: latestNavDateIn(rows as Array<{ date?: string }>),
  });
  await redisSet(navPayloadKey(cleanCode), payload, 7 * 24 * 3600).catch(() => {});
  if (meta?.scheme_name) {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload, updated_at)
        VALUES (${numCode}, ${meta.scheme_name}, ${JSON.stringify(meta)}::jsonb, NOW())
        ON CONFLICT (scheme_code) DO NOTHING
      `;
    } catch {
      // Ignore schemes table insertion failure
    }
  }
  return inserted;
}
export async function ensureSchemeTrackedAndBackfilled(schemeCode: string): Promise<boolean> {
  const cleanCode = String(schemeCode).trim();
  const numCode = Number(cleanCode);
  if (!Number.isFinite(numCode) || numCode <= 0) return false;
  const sql = getDb();
  const existing = (await sql`
    SELECT count(*) as count FROM mutual_fund_nav WHERE scheme_code = ${numCode} LIMIT 1
  `) as Array<{ count: string | number }>;
  if (Number(existing[0]?.count ?? 0) > 0) {
    const tracked = await isSchemeTracked(cleanCode);
    if (!tracked) {
      const lookup = (await sql`
        SELECT scheme_name, payload FROM mutual_fund_schemes WHERE scheme_code = ${numCode} LIMIT 1
      `) as Array<{ scheme_name: string; payload?: { fund_house?: string } }>;
      const schemeName = lookup[0]?.scheme_name ?? `Scheme ${cleanCode}`;
      const amfiName = lookup[0]?.payload?.fund_house ?? null;
      await registerTrackedScheme(cleanCode, schemeName, amfiName);
    }
    return true;
  }
  let schemeName = `Scheme ${cleanCode}`;
  let amfiName: string | null = null;
  const lookup = (await sql`
    SELECT scheme_name, payload FROM mutual_fund_schemes WHERE scheme_code = ${numCode} LIMIT 1
  `) as Array<{ scheme_name: string; payload?: { fund_house?: string } }>;
  if (lookup.length > 0) {
    schemeName = lookup[0].scheme_name;
    amfiName = lookup[0].payload?.fund_house ?? null;
  }
  await registerTrackedScheme(cleanCode, schemeName, amfiName);
  const inserted = await backfillSchemeHistory(cleanCode, schemeName);
  return inserted > 0;
}
