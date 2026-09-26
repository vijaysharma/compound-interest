import { timingSafeEqual } from 'node:crypto';
import { getDb } from '@/lib/db';
import { ensureTables } from '@/lib/db/migrations';
import { parseNavPayload, NAV_BATCH_CONCURRENCY } from '@/actions/data/constants';
import {
  BACKGROUND_FETCH_TIMEOUT_MS,
  type RefreshOutcome,
  refreshSchemeIfStale,
} from '@/actions/data/navSync';
export interface CandidateRow {
  scheme_code: string;
  payload: unknown;
}
export function isCronAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}
export async function fetchCronCandidates(watermarkDate: string, limit: number): Promise<CandidateRow[]> {
  await ensureTables(getDb());
  const sql = getDb();
  return (await sql`
    SELECT t.scheme_code, NULL as payload
    FROM tracked_schemes t
    LEFT JOIN mutual_fund_nav n ON n.scheme_code = t.scheme_code
    WHERE t.is_active = TRUE
    GROUP BY t.scheme_code
    HAVING max(n.date) IS NULL OR max(n.date) < ${watermarkDate}::date
    ORDER BY max(n.date) ASC NULLS FIRST
    LIMIT ${limit}
  `) as CandidateRow[];
}
export async function executeCronWorkers(
  candidates: CandidateRow[],
  deadline: number
): Promise<{ outcomes: Record<RefreshOutcome, number>; ranOutOfTime: number }> {
  const outcomes: Record<RefreshOutcome, number> = {
    current: 0,
    gated: 0,
    refreshed: 0,
    behind: 0,
    failed: 0,
  };
  let ranOutOfTime = 0;
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(NAV_BATCH_CONCURRENCY, candidates.length) },
    async () => {
      while (cursor < candidates.length) {
        const row = candidates[cursor++];
        if (Date.now() >= deadline) {
          ranOutOfTime += 1;
          continue;
        }
        const remaining = Math.max(1000, deadline - Date.now());
        const outcome = await refreshSchemeIfStale(
          row.scheme_code,
          parseNavPayload(row.payload),
          Math.min(BACKGROUND_FETCH_TIMEOUT_MS, remaining)
        );
        outcomes[outcome] += 1;
      }
    }
  );
  await Promise.all(workers);
  return { outcomes, ranOutOfTime };
}
export async function syncStoredSchemesFromAmfi(): Promise<{ amfiTotal: number; updated: number }> {
  try {
    const { fetchAmfiLatest } = await import('@/lib/amfi/amfiClient');
    const { bulkUpsertAmfiSchemes } = await import('@/lib/amfi/amfiBulkStorage');
    const parsed = await fetchAmfiLatest();
    const result = await bulkUpsertAmfiSchemes(parsed, 200, 20_000);
    return { amfiTotal: parsed.byScheme.size, updated: result.totalUpserted };
  } catch (err) {
    console.warn('[cron] AMFI sync failed:', err);
    return { amfiTotal: 0, updated: 0 };
  }
}
