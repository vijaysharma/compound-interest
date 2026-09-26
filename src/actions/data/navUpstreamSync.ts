import { getDb } from '@/lib/db';
import { redisSet } from '@/lib/redis';
import { latestNavDateIn } from '../../utilities/navCalendar';
import { navDateToISO } from '@/utilities/dateUtils';
import {
  NAV_CACHE_TTL_SECONDS,
  NAV_IN_MEMORY_TTL_MS,
  mfNavCache,
  navPayloadKey,
} from './constants';
export type NavPayload = { data: unknown[]; [k: string]: unknown };
export function rememberPayload(schemeCode: string, payload: NavPayload): void {
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
    latest: latestNavDateIn(payload.data as Array<{ date?: string }>),
  });
  redisSet(navPayloadKey(schemeCode), payload, NAV_CACHE_TTL_SECONDS).catch(() => {});
}
export async function syncSchemeFromUpstream(
  schemeCode: string,
  timeoutMs: number,
  previous?: NavPayload | null
): Promise<NavPayload | null> {
  let payload: NavPayload | null = null;
  try {
    const { fetchAmfiLatest } = await import('@/lib/amfi/amfiClient');
    const amfiParsed = await fetchAmfiLatest(timeoutMs);
    const rows = amfiParsed.byScheme.get(schemeCode);
    if (rows && rows.length > 0) {
      const meta = amfiParsed.schemes.get(schemeCode);
      const { mergeNavSeries } = await import('@/lib/amfi/amfiStorage');
      const existingRows = (previous?.data as Array<{ date: string; nav: string }>) ?? [];
      const merged = mergeNavSeries(existingRows, rows);
      payload = {
        meta: { scheme_code: schemeCode, scheme_name: meta?.schemeName ?? `Scheme ${schemeCode}`, isin_growth: meta?.isinGrowth ?? null },
        data: merged,
      };
    }
  } catch (err) {
    console.warn(`[amfi] latest fetch failed for ${schemeCode}:`, err);
  }
  if (!payload || !Array.isArray(payload.data) || payload.data.length === 0) return null;
  const isAtLeastAsComplete = !previous || payload.data.length >= previous.data.length;
  if (isAtLeastAsComplete) {
    try {
      const sql = getDb();
      const navRows = (payload.data as Array<{ date: string; nav: string }>)
        .map((r) => ({
          scheme_code: schemeCode,
          date: navDateToISO(r.date),
          nav: parseFloat(r.nav),
        }))
        .filter((r) => r.date && Number.isFinite(r.nav));
      if (navRows.length > 0) {
        await sql`
          INSERT INTO mutual_fund_nav (scheme_code, date, nav, updated_at)
          SELECT x.scheme_code, x.date::date, x.nav::numeric, NOW()
          FROM jsonb_to_recordset(${JSON.stringify(navRows)}::jsonb) AS x(
            scheme_code VARCHAR(20),
            date TEXT,
            nav NUMERIC
          )
          ON CONFLICT (scheme_code, date) DO NOTHING
        `;
      }
    } catch (dbErr) {
      console.warn(`[nav] DB sync failed for ${schemeCode}:`, dbErr);
    }
  }
  rememberPayload(schemeCode, payload);
  return payload;
}
