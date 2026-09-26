import { fetchAmfiLatest, fetchAmfiHistoricalRange } from './amfiClient';
import { upsertSchemeNav } from './amfiStorage';
export async function syncLatestAmfiToDatabase(): Promise<{
  totalSchemes: number;
  updated: number;
  skipped: number;
  elapsedMs: number;
}> {
  const startedAt = Date.now();
  const parsed = await fetchAmfiLatest();
  let updated = 0;
  let skipped = 0;
  for (const [schemeCode, rows] of parsed.byScheme) {
    const meta = parsed.schemes.get(schemeCode);
    const schemeName = meta?.schemeName ?? `Scheme ${schemeCode}`;
    const isinGrowth = meta?.isinGrowth ?? null;
    const res = await upsertSchemeNav(schemeCode, schemeName, rows, isinGrowth);
    if (res.success) updated++;
    else skipped++;
  }
  return {
    totalSchemes: parsed.byScheme.size,
    updated,
    skipped,
    elapsedMs: Date.now() - startedAt,
  };
}
export async function syncSchemeHistoryFromAmfi(
  schemeCode: string,
  fromIso: string,
  toIso: string
): Promise<{ success: boolean; rowsCount: number }> {
  try {
    const parsed = await fetchAmfiHistoricalRange(fromIso, toIso);
    const rows = parsed.byScheme.get(schemeCode);
    if (!rows || rows.length === 0) return { success: false, rowsCount: 0 };
    const meta = parsed.schemes.get(schemeCode);
    const res = await upsertSchemeNav(schemeCode, meta?.schemeName ?? `Scheme ${schemeCode}`, rows, meta?.isinGrowth ?? null);
    return { success: res.success, rowsCount: res.totalRows };
  } catch (err) {
    console.warn(`[amfiSync] Historical sync failed for ${schemeCode}:`, err);
    return { success: false, rowsCount: 0 };
  }
}
