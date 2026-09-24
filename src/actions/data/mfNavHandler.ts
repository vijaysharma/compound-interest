import { after } from 'next/server';
import { ISO_DATE_REGEX, resolveDateRange } from '@/utilities/dateGuards';
import { latestNavDateIn } from '@/utilities/navCalendar';
import { sliceNavHistory } from '@/utilities/navSlice';
import { resolveFreshnessCeiling } from './navWatermark';
import {
  FIRST_FETCH_TIMEOUT_MS,
  type NavPayload,
  runNavMaintenance,
  syncSchemeFromUpstream,
} from './navSync';
import { readStored } from './navStoredReader';
export { readStored } from './navStoredReader';
export async function handleGetMutualFundNav(
  schemeCodeRaw: string | number,
  requestedEndDate?: string | null,
  requestedStartDate?: string | null
): Promise<unknown> {
  const schemeCode = String(schemeCodeRaw).trim();
  if (!/^\d{1,10}$/.test(schemeCode)) {
    throw new Error('Invalid scheme code. Must be numeric.');
  }
  const { endDate } = resolveDateRange(undefined, requestedEndDate);
  const explicitStart =
    requestedStartDate && ISO_DATE_REGEX.test(requestedStartDate.trim())
      ? requestedStartDate.trim()
      : null;
  const stored = await readStored(schemeCode);
  if (!stored.payload) {
    const fetched = await syncSchemeFromUpstream(schemeCode, FIRST_FETCH_TIMEOUT_MS, null);
    if (!fetched) {
      throw new Error('Failed to fetch mutual fund NAV data');
    }
    scheduleMaintenance([{ code: schemeCode, current: fetched }]);
    const firstCeiling = await resolveFreshnessCeiling(
      endDate,
      latestNavDateIn(fetched.data as Array<{ date?: string }>)
    );
    return withResponseMeta(fetched, firstCeiling, explicitStart, endDate);
  }
  const ceiling = await resolveFreshnessCeiling(endDate, stored.latest);
  const isFresh = Boolean(stored.latest && stored.latest >= ceiling);
  if (!isFresh) {
    scheduleMaintenance([{ code: schemeCode, current: stored.payload }]);
  }
  return withResponseMeta(stored.payload, ceiling, explicitStart, endDate);
}
export function withResponseMeta(
  payload: NavPayload,
  marketAsOf: string,
  startDate: string | null,
  endDate: string
): NavPayload {
  const rows = startDate
    ? sliceNavHistory(payload.data as Array<{ date?: string }>, startDate, endDate)
    : payload.data;
  const data = rows === payload.data ? payload.data : (rows as unknown[]);
  return { ...payload, data, marketAsOf };
}
export function scheduleMaintenance(
  schemes: Array<{ code: string; current: NavPayload | null }>
): void {
  try {
    after(() => runNavMaintenance(schemes));
  } catch {
    void runNavMaintenance(schemes);
  }
}
