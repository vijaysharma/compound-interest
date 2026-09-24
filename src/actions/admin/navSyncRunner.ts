import { NAV_BATCH_CONCURRENCY, parseNavPayload } from '@/actions/data/constants';
import { latestNavDateIn } from '@/utilities/navCalendar';
import { syncSchemeFromUpstream } from '@/actions/data/navSync';
import type { AdminNavCandidateRow, NavSyncSchemeResult } from './navSyncTypes';
export async function runAdminNavWorkers(
  rows: AdminNavCandidateRow[],
  deadline: number
): Promise<NavSyncSchemeResult[]> {
  const results: NavSyncSchemeResult[] = [];
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
  results.sort((a, b) => (a.after ?? '').localeCompare(b.after ?? ''));
  return results;
}
