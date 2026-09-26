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
          SELECT t.scheme_code, t.scheme_name, NULL as payload, max(n.date)::text AS latest_nav_date
          FROM tracked_schemes t
          LEFT JOIN mutual_fund_nav n ON n.scheme_code = t.scheme_code
          WHERE t.scheme_code = ANY(${requested})
          GROUP BY t.scheme_code, t.scheme_name
        `) as AdminNavCandidateRow[])
      : ((await sql`
          SELECT t.scheme_code, t.scheme_name, NULL as payload, max(n.date)::text AS latest_nav_date
          FROM tracked_schemes t
          LEFT JOIN mutual_fund_nav n ON n.scheme_code = t.scheme_code
          WHERE t.is_active = TRUE
          GROUP BY t.scheme_code, t.scheme_name
          HAVING max(n.date) IS NULL OR max(n.date) < ${watermark?.date ?? null}::date
          ORDER BY max(n.date) ASC NULLS FIRST
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
