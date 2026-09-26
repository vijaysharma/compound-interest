import { readStored } from '@/actions/data/navStoredReader';
import { handleGetBatchMutualFundNav } from '@/actions/data/mfBatchNavHandler';
import { navDateToISO } from '@/utilities/dateUtils';
import type { NavType } from '@/types/types';
import type { NavPoint } from '@/views/strategy/types';
import { syncSchemeHistoryFromAmfi } from './amfiSync';
export async function getNav(schemeCode: string, targetDate: string): Promise<NavPoint | null> {
  const stored = await readStored(schemeCode);
  const rows = (stored.payload?.data as NavType[]) ?? [];
  if (rows.length === 0) return null;
  const match = rows.find((r) => navDateToISO(r.date) === targetDate || r.date === targetDate);
  if (!match) return null;
  const navNum = parseFloat(match.nav);
  return Number.isFinite(navNum) ? { date: targetDate, nav: navNum } : null;
}
export async function getNavHistory(
  schemeCode: string,
  fromDate?: string,
  toDate?: string
): Promise<NavType[]> {
  const stored = await readStored(schemeCode);
  let rows = (stored.payload?.data as NavType[]) ?? [];
  if (rows.length === 0 && fromDate && toDate) {
    await syncSchemeHistoryFromAmfi(schemeCode, fromDate, toDate);
    const refreshed = await readStored(schemeCode);
    rows = (refreshed.payload?.data as NavType[]) ?? [];
  }
  if (!fromDate && !toDate) return rows;
  return rows.filter((r) => {
    const iso = navDateToISO(r.date);
    if (fromDate && iso < fromDate) return false;
    if (toDate && iso > toDate) return false;
    return true;
  });
}
export async function getBatchNavHistory(
  schemeCodes: (string | number)[],
  requestedEndDate?: string | null,
  requestedStartDate?: string | null
): Promise<Record<string, NavType[]>> {
  const rawBatch = await handleGetBatchMutualFundNav(schemeCodes, requestedEndDate, requestedStartDate);
  const result: Record<string, NavType[]> = {};
  for (const [code, rawPayload] of Object.entries(rawBatch)) {
    const payload = rawPayload as { data?: NavType[] };
    if (payload && Array.isArray(payload.data)) {
      result[code] = payload.data;
    }
  }
  return result;
}
