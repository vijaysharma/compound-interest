'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import { probeMarketWatermark, readWatermark } from '@/actions/data/navWatermark';
import type { AdminNavCandidateRow, NavSyncReport } from './navSyncTypes';
import { runAdminNavWorkers } from './navSyncRunner';
export type { NavSyncReport, NavSyncSchemeResult } from './navSyncTypes';
const MAX_SCHEMES = 25;
const BUDGET_MS = 20_000;
export async function syncNavAction(
  token?: string | null,
  options?: { schemeCodes?: string[] }
): Promise<NavSyncReport> {
  const startedAt = Date.now();
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const probe = await probeMarketWatermark({ force: true });
  const watermark = probe.watermark ?? (await readWatermark());
  const requested = (options?.schemeCodes ?? [])
    .map((code) => String(code).trim())
    .filter((code) => /^\d{1,10}$/.test(code));
  let rows: AdminNavCandidateRow[] = [];
  try {
    rows = requested.length
      ? ((await sql`
          SELECT n.scheme_code, s.scheme_name, n.payload, n.latest_nav_date::text AS latest_nav_date
          FROM mutual_fund_nav n
          LEFT JOIN mutual_fund_schemes s USING (scheme_code)
          WHERE n.scheme_code = ANY(${requested})
        `) as AdminNavCandidateRow[])
      : ((await sql`
          SELECT n.scheme_code, s.scheme_name, n.payload, n.latest_nav_date::text AS latest_nav_date
          FROM mutual_fund_nav n
          LEFT JOIN mutual_fund_schemes s USING (scheme_code)
          WHERE ${watermark?.date ?? null}::date IS NULL
             OR n.latest_nav_date IS NULL
             OR n.latest_nav_date < ${watermark?.date ?? null}::date
          ORDER BY n.latest_nav_date ASC NULLS FIRST
          LIMIT ${MAX_SCHEMES}
        `) as AdminNavCandidateRow[]);
  } catch (dbErr) {
    console.warn('[nav][admin] candidate query failed:', dbErr);
    throw new Error('Database unavailable');
  }
  const seen = new Set(rows.map((r) => r.scheme_code));
  for (const code of requested) {
    if (!seen.has(code)) {
      rows.push({ scheme_code: code, scheme_name: null, payload: null, latest_nav_date: null });
    }
  }
  const deadline = startedAt + BUDGET_MS;
  const results = await runAdminNavWorkers(rows, deadline);
  const finalWatermark = probe.watermark ?? watermark;
  return {
    watermark: finalWatermark?.date ?? null,
    watermarkAdvanced: probe.advanced,
    noAdvanceCount: finalWatermark?.noAdvanceCount ?? 0,
    considered: rows.length,
    schemes: results,
    elapsedMs: Date.now() - startedAt,
  };
}
