'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import { latestNavDateIn } from '@/utilities/navCalendar';
import { parseNavPayload, NAV_BATCH_CONCURRENCY } from '@/actions/data/constants';
import { probeMarketWatermark, readWatermark } from '@/actions/data/navWatermark';
import { syncSchemeFromUpstream } from '@/actions/data/navSync';
/**
 * Manual NAV refresh for the admin dashboard.
 *
 * The cron is the normal path and the read path never waits on upstream, so
 * this exists for the cases neither covers: the cron run failed or was skipped,
 * an AMC published unusually late, or someone needs to confirm what we actually
 * hold right now. It reports per scheme rather than returning a count, because
 * the question being asked is "what did it fetch and store", not "did it work".
 *
 * Differences from the cron, both deliberate:
 *
 * - It **forces** the fetch, bypassing each scheme's backoff window. Backoff
 *   exists to stop automated retries hammering a provider that has nothing new;
 *   a human pressing a button is a direct instruction and should not be
 *   silently ignored.
 * - It can target specific scheme codes, for the late-publishing-AMC case.
 */
/** One scheme's before/after, so the caller can see what actually changed. */
export interface NavSyncSchemeResult {
  schemeCode: string;
  schemeName: string | null;
  /** Newest NAV date we held before this run, `YYYY-MM-DD`. */
  before: string | null;
  /** Newest NAV date we hold now. Unchanged means upstream had nothing newer. */
  after: string | null;
  rowsBefore: number;
  rowsAfter: number;
  /** `stored` means the payload was written; `unchanged` that it already matched. */
  outcome: 'stored' | 'unchanged' | 'failed' | 'skipped-no-time';
}
export interface NavSyncReport {
  /** Newest NAV date observed upstream after this run's probe. */
  watermark: string | null;
  watermarkAdvanced: boolean;
  /** Consecutive probes that have found nothing newer — high means a real gap. */
  noAdvanceCount: number;
  considered: number;
  schemes: NavSyncSchemeResult[];
  elapsedMs: number;
}
/**
 * Bounded so the action returns inside the 30s function limit from
 * `vercel.json`. The provider was measured answering the same request in 1.2s
 * and in 62s, so the wall-clock budget rather than the count is what keeps a
 * run safe; the count only caps how much is examined.
 */
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
  // Forced, because a manual run should reflect upstream as it is right now
  // rather than whatever the last scheduled probe happened to see.
  const probe = await probeMarketWatermark({ force: true });
  const watermark = probe.watermark ?? (await readWatermark());
  const requested = (options?.schemeCodes ?? [])
    .map((code) => String(code).trim())
    .filter((code) => /^\d{1,10}$/.test(code));
  type Row = {
    scheme_code: string;
    scheme_name: string | null;
    payload: unknown;
    latest_nav_date: string | null;
  };
  let rows: Row[] = [];
  try {
    rows = requested.length
      ? ((await sql`
          SELECT n.scheme_code, s.scheme_name, n.payload, n.latest_nav_date::text AS latest_nav_date
          FROM mutual_fund_nav n
          LEFT JOIN mutual_fund_schemes s USING (scheme_code)
          WHERE n.scheme_code = ANY(${requested})
        `) as Row[])
      : // Oldest first, so a run always works on whatever is furthest behind.
        ((await sql`
          SELECT n.scheme_code, s.scheme_name, n.payload, n.latest_nav_date::text AS latest_nav_date
          FROM mutual_fund_nav n
          LEFT JOIN mutual_fund_schemes s USING (scheme_code)
          WHERE ${watermark?.date ?? null}::date IS NULL
             OR n.latest_nav_date IS NULL
             OR n.latest_nav_date < ${watermark?.date ?? null}::date
          ORDER BY n.latest_nav_date ASC NULLS FIRST
          LIMIT ${MAX_SCHEMES}
        `) as Row[]);
  } catch (dbErr) {
    console.warn('[nav][admin] candidate query failed:', dbErr);
    throw new Error('Database unavailable');
  }
  /*
   * A requested scheme we have never stored has no row to select, so it would
   * silently vanish from the report. Carried through as a synthetic entry with
   * no `before`, which is also how a first-time fetch of a new scheme works.
   */
  const seen = new Set(rows.map((r) => r.scheme_code));
  for (const code of requested) {
    if (!seen.has(code)) {
      rows.push({ scheme_code: code, scheme_name: null, payload: null, latest_nav_date: null });
    }
  }
  const results: NavSyncSchemeResult[] = [];
  const deadline = startedAt + BUDGET_MS;
  let cursor = 0;
  const workers = Array.from({ length: Math.min(NAV_BATCH_CONCURRENCY, rows.length) }, async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      const previous = parseNavPayload(row.payload);
      const before =
        row.latest_nav_date ??
        (previous ? latestNavDateIn(previous.data as Array<{ date?: string }>) : null);
      const rowsBefore = previous?.data.length ?? 0;
      if (Date.now() >= deadline) {
        results.push({
          schemeCode: row.scheme_code,
          schemeName: row.scheme_name,
          before,
          after: before,
          rowsBefore,
          rowsAfter: rowsBefore,
          outcome: 'skipped-no-time',
        });
        continue;
      }
      const remaining = Math.max(1000, deadline - Date.now());
      const fetched = await syncSchemeFromUpstream(row.scheme_code, remaining, previous);
      const after = fetched
        ? latestNavDateIn(fetched.data as Array<{ date?: string }>)
        : before;
      const rowsAfter = fetched?.data.length ?? rowsBefore;
      results.push({
        schemeCode: row.scheme_code,
        schemeName: row.scheme_name,
        before,
        after,
        rowsBefore,
        rowsAfter,
        outcome: !fetched
          ? 'failed'
          : after !== before || rowsAfter !== rowsBefore
            ? 'stored'
            : 'unchanged',
      });
    }
  });
  await Promise.all(workers);
  // Oldest-first, so the entries that still need attention read first.
  results.sort((a, b) => (a.after ?? '').localeCompare(b.after ?? ''));
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
