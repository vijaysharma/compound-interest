import { getDb } from '@/lib/db';
import { redisMGet } from '@/lib/redis';
import { ISO_DATE_REGEX, resolveDateRange } from '@/utilities/dateGuards';
import { latestNavDateIn } from '@/utilities/navCalendar';
import {
  NAV_BATCH_CONCURRENCY,
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
  parseNavPayload,
} from './constants';
import { resolveFreshnessCeiling } from './navWatermark';
import type { NavPayload } from './navSync';
import { scheduleMaintenance, withResponseMeta } from './mfNavHandler';
import { mapWithConcurrency } from './concurrency';
const latestOf = (payload: NavPayload) =>
  latestNavDateIn(payload.data as Array<{ date?: string }>);
export async function handleGetBatchMutualFundNav(
  schemeCodesRaw: (string | number)[],
  requestedEndDate?: string | null,
  requestedStartDate?: string | null
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  if (!Array.isArray(schemeCodesRaw) || schemeCodesRaw.length === 0) {
    return result;
  }
  const validCodes = Array.from(
    new Set(
      schemeCodesRaw
        .map((c) => String(c).trim())
        .filter((c) => /^\d{1,10}$/.test(c))
    )
  );
  if (validCodes.length === 0) return result;
  const { endDate } = resolveDateRange(undefined, requestedEndDate);
  const explicitStart =
    requestedStartDate && ISO_DATE_REGEX.test(requestedStartDate.trim())
      ? requestedStartDate.trim()
      : null;
  const found = new Map<string, { payload: NavPayload; latest: string | null }>();
  const missing: string[] = [];
  for (const code of validCodes) {
    const cached = mfNavCache.get(code);
    if (cached && cached.expiresAt > Date.now()) {
      const payload = parseNavPayload(cached.data);
      if (payload) {
        found.set(code, {
          payload,
          latest: cached.latest !== undefined ? cached.latest : latestOf(payload),
        });
        continue;
      }
    }
    missing.push(code);
  }
  if (missing.length > 0) {
    const redisResults = await redisMGet<unknown>(missing.map(navPayloadKey));
    const stillMissing: string[] = [];
    for (const code of missing) {
      const payload = parseNavPayload(redisResults[navPayloadKey(code)]);
      if (payload) {
        const latest = latestOf(payload);
        mfNavCache.set(code, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: payload,
          latest,
        });
        found.set(code, { payload, latest });
        continue;
      }
      stillMissing.push(code);
    }
    missing.length = 0;
    missing.push(...stillMissing);
  }
  if (missing.length > 0) {
    try {
      const sql = getDb();
      const missingNums = missing.map((c) => Number(c));
      const rows = (await sql`
        SELECT scheme_code, to_char(date, 'DD-MM-YYYY') as date, nav::text as nav
        FROM mutual_fund_nav WHERE scheme_code = ANY(${missingNums})
        ORDER BY scheme_code, mutual_fund_nav.date DESC
      `) as Array<{ scheme_code: string | number; date: string; nav: string }>;
      const stillMissing = new Set(missing);
      const grouped = new Map<string, Array<{ date: string; nav: string }>>();
      for (const row of rows) {
        const codeStr = String(row.scheme_code);
        let list = grouped.get(codeStr);
        if (!list) {
          list = [];
          grouped.set(codeStr, list);
        }
        list.push({ date: row.date, nav: row.nav });
      }
      for (const [code, series] of grouped.entries()) {
        const payload: NavPayload = { meta: { scheme_code: code }, data: series };
        const latest = latestOf(payload);
        mfNavCache.set(code, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: payload,
          latest,
        });
        found.set(code, { payload, latest });
        stillMissing.delete(code);
      }
      missing.length = 0;
      missing.push(...stillMissing);
    } catch (dbErr) {
      console.warn('[nav] batch DB read failed:', dbErr);
    }
  }
  // Missing schemes, ones holding only a few days of NAV (a partial import), and ones whose history
  // walk is part-way get their full history backfilled before answering.
  const { hasShortNavHistory, pendingHistoryBackfills } = await import('@/lib/amfi/autoInclusion');
  const pending = await pendingHistoryBackfills([...found.keys()]);
  const needsBackfill = [
    ...missing,
    ...[...found]
      .filter(([code, entry]) => hasShortNavHistory(entry.payload) || pending.has(code))
      .map(([code]) => code),
  ];
  if (needsBackfill.length > 0) {
    const { readStoredWithBackfill } = await import('./navStoredReader');
    await mapWithConcurrency(needsBackfill, NAV_BATCH_CONCURRENCY, async (code) => {
      const stored = await readStoredWithBackfill(code);
      if (stored.payload) found.set(code, { payload: stored.payload, latest: stored.latest ?? latestOf(stored.payload) });
    });
  }
  const ceiling = await resolveFreshnessCeiling(
    endDate,
    [...found.values()].reduce<string | null>(
      (acc, v) => (v.latest && (!acc || v.latest > acc) ? v.latest : acc),
      null
    )
  );
  // Cached series behind the market are re-read from the DB before anything goes upstream.
  const { refreshStaleFromDb } = await import('./navStoredReader');
  await mapWithConcurrency([...found.keys()], NAV_BATCH_CONCURRENCY, async (code) => {
    const entry = found.get(code)!;
    if (entry.latest && entry.latest >= ceiling) return;
    const current = await refreshStaleFromDb(code, { ...entry, fromDb: false }, ceiling);
    if (current.payload) found.set(code, { payload: current.payload, latest: current.latest });
  });
  const stale: Array<{ code: string; current: NavPayload | null }> = [];
  for (const [code, entry] of found) {
    result[code] = withResponseMeta(entry.payload, ceiling, explicitStart, endDate);
    if (!entry.latest || entry.latest < ceiling) {
      stale.push({ code, current: entry.payload });
    }
  }
  if (stale.length > 0) scheduleMaintenance(stale);
  return result;
}
