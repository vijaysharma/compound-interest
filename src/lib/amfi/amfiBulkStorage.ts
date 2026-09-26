import { getDb } from '../db';
import { navDateToISO } from '@/utilities/dateUtils';
import type { AmfiParseResult } from './amfiTypes';
export interface BulkSyncResult {
  totalConsidered: number;
  totalUpserted: number;
  batchesProcessed: number;
  elapsedMs: number;
  hasMore: boolean;
}
export async function bulkUpsertAmfiSchemes(
  parsed: AmfiParseResult,
  batchSize = 200,
  timeBudgetMs = 25_000
): Promise<BulkSyncResult> {
  const startedAt = Date.now();
  const sql = getDb();
  const entries = Array.from(parsed.byScheme.entries());
  let totalUpserted = 0;
  let batchesProcessed = 0;
  let cursor = 0;
  while (cursor < entries.length) {
    if (Date.now() - startedAt >= timeBudgetMs) break;
    const chunk = entries.slice(cursor, cursor + batchSize);
    cursor += chunk.length;
    batchesProcessed++;
    const schemeBatch = chunk.map(([code]) => {
      const meta = parsed.schemes.get(code);
      const name = meta?.schemeName ?? `Scheme ${code}`;
      return {
        scheme_code: code,
        scheme_name: name,
        payload: { scheme_code: code, scheme_name: name, isin_growth: meta?.isinGrowth ?? null },
      };
    });
    await sql`
      INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload, updated_at)
      SELECT x.scheme_code, x.scheme_name, x.payload, NOW()
      FROM jsonb_to_recordset(${JSON.stringify(schemeBatch)}::jsonb) AS x(
        scheme_code TEXT,
        scheme_name TEXT,
        payload JSONB
      )
      ON CONFLICT (scheme_code) DO UPDATE SET
        scheme_name = EXCLUDED.scheme_name,
        updated_at = NOW()
    `;
    const flatRows: Array<{ scheme_code: string; date: string; nav: number }> = [];
    for (const [code, rows] of chunk) {
      for (const r of rows) {
        const iso = navDateToISO(r.date);
        const navNum = parseFloat(r.nav);
        if (iso && Number.isFinite(navNum)) {
          flatRows.push({ scheme_code: code, date: iso, nav: navNum });
        }
      }
    }
    if (flatRows.length > 0) {
      await sql`
        INSERT INTO mutual_fund_nav (scheme_code, date, nav, updated_at)
        SELECT x.scheme_code, x.date::date, x.nav::numeric, NOW()
        FROM jsonb_to_recordset(${JSON.stringify(flatRows)}::jsonb) AS x(
          scheme_code VARCHAR(20),
          date TEXT,
          nav NUMERIC
        )
        ON CONFLICT (scheme_code, date) DO NOTHING
      `;
    }
    totalUpserted += chunk.length;
  }
  return {
    totalConsidered: entries.length,
    totalUpserted,
    batchesProcessed,
    elapsedMs: Date.now() - startedAt,
    hasMore: cursor < entries.length,
  };
}
