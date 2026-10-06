import { ensureTables, getDb } from '../src/lib/db';
import { MIN_BACKFILLED_NAV_ROWS, backfillSchemeHistory } from '../src/lib/amfi/autoInclusion';
try {
  if (typeof process.loadEnvFile === 'function') {
    try { process.loadEnvFile('.env.local'); } catch { /* ignore */ }
    try { process.loadEnvFile('.env'); } catch { /* ignore */ }
  }
} catch { /* ignore */ }
async function seedSchemeInception(schemeCode: string): Promise<{ count: number; complete: boolean }> {
  // No time limit here: walk AMFI's history back to the scheme's first NAV.
  const result = await backfillSchemeHistory(schemeCode, { deadline: Number.POSITIVE_INFINITY });
  if (result.error) throw result.error;
  return { count: result.rows, complete: result.complete };
}
/**
 * Backfills, from AMFI's NAV history report, every active tracked scheme holding fewer than
 * MIN_BACKFILLED_NAV_ROWS rows (a partial import). Bulk seeding by date range is the admin NAV
 * history sync; this walks per scheme, so it is for the stragglers.
 */
async function main(): Promise<void> {
  let concurrency = 2;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--concurrency=')) concurrency = Math.max(1, parseInt(arg.split('=')[1], 10) || 2);
  }
  const sql = getDb();
  await ensureTables(sql);
  const schemes = (await sql`
    SELECT t.scheme_code, t.scheme_name, count(n.date)::int AS rows
    FROM tracked_schemes t
    LEFT JOIN mutual_fund_nav n ON n.scheme_code = t.scheme_code::integer
    WHERE t.is_active
    GROUP BY t.scheme_code, t.scheme_name
    HAVING count(n.date) < ${MIN_BACKFILLED_NAV_ROWS}
    ORDER BY t.scheme_code
  `) as Array<{ scheme_code: string; scheme_name: string; rows: number }>;
  console.log(`[seed-inception] ${schemes.length} tracked schemes with short history (concurrency: ${concurrency}).`);
  let cursor = 0;
  let totalRows = 0;
  const startedAt = Date.now();
  async function worker(id: number): Promise<void> {
    while (cursor < schemes.length) {
      const idx = cursor++;
      const s = schemes[idx];
      const start = Date.now();
      try {
        const { count, complete } = await seedSchemeInception(s.scheme_code);
        totalRows += count;
        console.log(`[Worker ${id}] [${idx + 1}/${schemes.length}] ${s.scheme_code} (${s.scheme_name.slice(0, 35)}...): ${s.rows} -> +${count} rows${complete ? (count === 0 ? ' (not listed by AMFI)' : '') : ' (incomplete)'} in ${Date.now() - start}ms`);
      } catch (err) {
        console.warn(`[Worker ${id}] [${idx + 1}/${schemes.length}] ${s.scheme_code} failed:`, err instanceof Error ? err.message : err);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));
  console.log(`\n[seed-inception] Completed in ${Math.round((Date.now() - startedAt) / 1000)}s.`);
  console.log(`[seed-inception] Total rows written to mutual_fund_nav: ${totalRows}`);
}
main().then(() => process.exit(0)).catch((err) => { console.error('Fatal:', err); process.exit(1); });
