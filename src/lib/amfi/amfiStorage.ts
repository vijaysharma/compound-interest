import { getDb } from '@/lib/db';
import type { NavType } from '@/types/types';
import { navDateToISO } from '@/utilities/dateUtils';
import { latestNavDateIn } from '@/utilities/navCalendar';
import { mfNavCache, NAV_IN_MEMORY_TTL_MS } from '@/actions/data/constants';
export function mergeNavSeries(existing: NavType[] = [], incoming: NavType[] = []): NavType[] {
  const byDate = new Map<string, string>();
  for (const row of existing) {
    if (row?.date && row?.nav) byDate.set(row.date, row.nav);
  }
  for (const row of incoming) {
    if (row?.date && row?.nav) byDate.set(row.date, row.nav);
  }
  const merged: NavType[] = Array.from(byDate.entries()).map(([date, nav]) => ({ date, nav }));
  return merged.sort((a, b) => {
    const isoA = navDateToISO(a.date);
    const isoB = navDateToISO(b.date);
    return isoB.localeCompare(isoA);
  });
}
export async function upsertSchemeNav(
  schemeCode: string,
  schemeName: string,
  incomingRows: NavType[],
  isinGrowth: string | null = null
): Promise<{ success: boolean; totalRows: number; latestDate: string | null }> {
  if (!schemeCode || incomingRows.length === 0) {
    return { success: false, totalRows: 0, latestDate: null };
  }
  const cached = mfNavCache.get(schemeCode);
  const cachedPayload = cached?.data as { data?: NavType[] } | undefined;
  const existingRows = cachedPayload?.data ?? [];
  const merged = mergeNavSeries(existingRows, incomingRows);
  const latestDate = latestNavDateIn(merged);
  const payload = {
    meta: { scheme_code: schemeCode, scheme_name: schemeName, isin_growth: isinGrowth },
    data: merged,
  };
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + NAV_IN_MEMORY_TTL_MS,
    data: payload,
    latest: latestDate,
  });
  try {
    const sql = getDb();
    await sql`
      INSERT INTO mutual_fund_schemes (scheme_code, scheme_name, payload, updated_at)
      VALUES (${schemeCode}, ${schemeName}, ${JSON.stringify(payload.meta)}::jsonb, NOW())
      ON CONFLICT (scheme_code) DO UPDATE SET scheme_name = EXCLUDED.scheme_name, updated_at = NOW()
    `;
    const navRows = merged.map((r) => ({
      scheme_code: schemeCode,
      date: navDateToISO(r.date),
      nav: parseFloat(r.nav),
    })).filter((r) => r.date && Number.isFinite(r.nav));
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
    return { success: true, totalRows: merged.length, latestDate };
  } catch (err) {
    console.warn(`[amfiStorage] DB upsert failed for ${schemeCode}:`, err);
    return { success: false, totalRows: merged.length, latestDate };
  }
}
