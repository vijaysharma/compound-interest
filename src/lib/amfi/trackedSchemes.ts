import { getDb } from '../db';
import type { Query } from '../db/types';
import type { TrackedScheme } from './amfiNavTypes';
interface CandidateRow { scheme_code: string; scheme_name: string; amfi_name: string }
interface SimpleScheme { scheme_code: string; scheme_name: string }
const MAJOR_AMCS = [
  { prefix: 'SBI', name: 'SBI Mutual Fund' },
  { prefix: 'HDFC', name: 'HDFC Mutual Fund' },
  { prefix: 'ICICI Prudential', name: 'ICICI Prudential Mutual Fund' },
  { prefix: 'Nippon India', name: 'Nippon India Mutual Fund' },
  { prefix: 'Kotak', name: 'Kotak Mahindra Mutual Fund' },
  { prefix: 'UTI', name: 'UTI Mutual Fund' },
  { prefix: 'Mirae Asset', name: 'Mirae Asset Mutual Fund' },
  { prefix: 'Motilal Oswal', name: 'Motilal Oswal Mutual Fund' },
];
export async function getActiveTrackedSchemes(db?: Query): Promise<TrackedScheme[]> {
  const sql = db ?? getDb();
  const rows = (await sql`
    SELECT scheme_code, scheme_name, amfi_name, is_active, created_at::text as created_at
    FROM tracked_schemes
    WHERE is_active = TRUE
    ORDER BY scheme_name ASC
  `) as TrackedScheme[];
  return rows;
}
export async function getActiveSchemeCodeSet(db?: Query): Promise<Set<string>> {
  const schemes = await getActiveTrackedSchemes(db);
  return new Set(schemes.map((s) => s.scheme_code));
}
export async function isSchemeTracked(schemeCode: string, db?: Query): Promise<boolean> {
  const sql = db ?? getDb();
  const rows = (await sql`
    SELECT scheme_code FROM tracked_schemes WHERE scheme_code = ${schemeCode} AND is_active = TRUE LIMIT 1
  `) as Array<{ scheme_code: string }>;
  return rows.length > 0;
}
export async function registerTrackedScheme(
  schemeCode: string,
  schemeName: string,
  amfiName?: string | null,
  db?: Query
): Promise<TrackedScheme> {
  const sql = db ?? getDb();
  const rows = (await sql`
    INSERT INTO tracked_schemes (scheme_code, scheme_name, amfi_name, is_active, created_at)
    VALUES (${schemeCode}, ${schemeName}, ${amfiName ?? null}, TRUE, NOW())
    ON CONFLICT (scheme_code) DO UPDATE SET
      is_active = TRUE,
      scheme_name = EXCLUDED.scheme_name
    RETURNING scheme_code, scheme_name, amfi_name, is_active, created_at::text as created_at
  `) as TrackedScheme[];
  return rows[0];
}
export async function seedDefaultTrackedSchemes(db?: Query): Promise<number> {
  const sql = db ?? getDb();
  const existingCount = (await sql`
    SELECT count(*) as count FROM tracked_schemes WHERE is_active = TRUE
  `) as Array<{ count: string | number }>;
  if (Number(existingCount[0]?.count ?? 0) >= 600) {
    return Number(existingCount[0]?.count ?? 0);
  }
  const allCandidates: CandidateRow[] = [];
  for (const amc of MAJOR_AMCS) {
    const qDirectGrowth = (await sql`
      SELECT scheme_code, scheme_name FROM mutual_fund_schemes
      WHERE scheme_name ILIKE ${amc.prefix + '%'} AND scheme_name ILIKE '%Direct%' AND scheme_name ILIKE '%Growth%'
        AND scheme_name NOT ILIKE '%IDCW%' AND scheme_name NOT ILIKE '%Dividend%'
      ORDER BY scheme_name LIMIT 30
    `) as SimpleScheme[];
    const qRegGrowth = (await sql`
      SELECT scheme_code, scheme_name FROM mutual_fund_schemes
      WHERE scheme_name ILIKE ${amc.prefix + '%'} AND scheme_name NOT ILIKE '%Direct%' AND scheme_name ILIKE '%Growth%'
        AND scheme_name NOT ILIKE '%IDCW%' AND scheme_name NOT ILIKE '%Dividend%'
      ORDER BY scheme_name LIMIT 25
    `) as SimpleScheme[];
    const qIdcw = (await sql`
      SELECT scheme_code, scheme_name FROM mutual_fund_schemes
      WHERE scheme_name ILIKE ${amc.prefix + '%'} AND (scheme_name ILIKE '%IDCW%' OR scheme_name ILIKE '%Dividend%')
      ORDER BY scheme_name LIMIT 30
    `) as SimpleScheme[];
    for (const item of [...qDirectGrowth, ...qRegGrowth, ...qIdcw]) {
      allCandidates.push({ scheme_code: item.scheme_code, scheme_name: item.scheme_name, amfi_name: amc.name });
    }
  }
  if (allCandidates.length > 0) {
    await sql`
      INSERT INTO tracked_schemes (scheme_code, scheme_name, amfi_name, is_active)
      SELECT x.scheme_code, x.scheme_name, x.amfi_name, TRUE
      FROM jsonb_to_recordset(${JSON.stringify(allCandidates)}::jsonb) AS x(
        scheme_code VARCHAR(20),
        scheme_name TEXT,
        amfi_name TEXT
      )
      ON CONFLICT (scheme_code) DO NOTHING
    `;
  }
  const countRow = (await sql`SELECT count(*) as count FROM tracked_schemes WHERE is_active = TRUE`) as Array<{ count: string | number }>;
  return Number(countRow[0]?.count ?? allCandidates.length);
}
