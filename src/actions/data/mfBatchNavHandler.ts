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
import { FIRST_FETCH_TIMEOUT_MS, type NavPayload, syncSchemeFromUpstream } from './navSync';
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
      const rows = (await sql`
        SELECT scheme_code, payload, latest_nav_date::text AS latest_nav_date
        FROM mutual_fund_nav WHERE scheme_code = ANY(${missing})
      `) as Array<{ scheme_code: string; payload: unknown; latest_nav_date: string | null }>;
      const stillMissing = new Set(missing);
      for (const row of rows) {
        const payload = parseNavPayload(row.payload);
        if (!payload) continue;
        const latest = row.latest_nav_date ?? latestOf(payload);
        mfNavCache.set(row.scheme_code, {
          expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
          data: payload,
          latest,
        });
        found.set(row.scheme_code, { payload, latest });
        stillMissing.delete(row.scheme_code);
      }
      missing.length = 0;
      missing.push(...stillMissing);
    } catch (dbErr) {
      console.warn('[nav] batch DB read failed:', dbErr);
    }
  }
  if (missing.length > 0) {
    await mapWithConcurrency(missing, NAV_BATCH_CONCURRENCY, async (code) => {
      const fetched = await syncSchemeFromUpstream(code, FIRST_FETCH_TIMEOUT_MS, null);
      if (fetched) found.set(code, { payload: fetched, latest: latestOf(fetched) });
    });
  }
  const ceiling = await resolveFreshnessCeiling(
    endDate,
    [...found.values()].reduce<string | null>(
      (acc, v) => (v.latest && (!acc || v.latest > acc) ? v.latest : acc),
      null
    )
  );
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
