import { MFJSONType, NavType } from '../../types/types';
import { getMutualFundNavAction, searchMutualFundsAction } from '@/actions/data';
import { getTodayISO } from '../../utilities/dateGuards';
import { isNavHistoryFresh, navFreshnessCeiling } from '../../utilities/navCalendar';
import { CLIENT_NAV_CACHE_TTL_MS, getSessionItem, recordApiUsage, setSessionItem } from './clientStorage';
export interface MFMetaType {
  fund_house?: string;
  scheme_type?: string;
  scheme_category?: string;
  scheme_code?: number | string;
  scheme_name?: string;
  isin_growth?: string;
  isin_div_reinvestment?: string | null;
}
export interface MFDetailsResult {
  data: NavType[];
  meta?: MFMetaType;
}
/**
 * The newest NAV the server has told us exists, as of the last response.
 *
 * The server judges freshness against a watermark it *observes* upstream, which
 * the browser cannot compute — it has no access to Redis and no way to know the
 * provider is two business days behind. Reconstructing it here from the
 * calendar is exactly what went wrong before: during a publication gap the two
 * sides disagree on every request, so the browser calls its cache stale, asks
 * the server, and the server returns the identical bytes it already held.
 *
 * So the server publishes `marketAsOf` with each response and the browser just
 * believes it. One definition of "current", held in one place.
 */
let marketAsOf: string | null = null;
const rememberMarketAsOf = (payload: { marketAsOf?: unknown }): void => {
  if (typeof payload?.marketAsOf === 'string' && payload.marketAsOf) {
    marketAsOf = payload.marketAsOf;
  }
};
/**
 * Whether a cached NAV history can answer a request for `endDate`.
 *
 * Entries used to be keyed by scheme code alone and trusted for 30 days, so a
 * date change re-served a month-old history and looked as though the date had
 * been ignored. Now an entry is good while it reaches whichever is earlier: the
 * date asked for, or the newest NAV the server says exists.
 *
 * Before the first response of a session there is no watermark, so it falls
 * back to the calendar prediction — wrong during a gap, but only for the very
 * first request, which has to go to the server regardless.
 */
export const historySatisfies = (
  data: NavType[] | undefined,
  endDate?: string | null
): boolean => {
  if (!data || data.length === 0) return false;
  const requested = endDate || getTodayISO();
  const ceiling = marketAsOf
    ? requested < marketAsOf
      ? requested
      : marketAsOf
    : navFreshnessCeiling(requested);
  return isNavHistoryFresh(data, ceiling);
};
const mfSearchCache = new Map<string, MFJSONType[]>();
export const mfNavCache = new Map<string, { expiresAt: number; data: NavType[] }>();
export const mfDetailsCache = new Map<string, { expiresAt: number; data: MFDetailsResult }>();
const mfNavRequests = new Map<string, Promise<NavType[]>>();
const mfSearchRequests = new Map<string, Promise<MFJSONType[]>>();
const MAX_SEARCH_CACHE_ENTRIES = 200;
export const fetchAllMfs = async (search = '', _signal?: AbortSignal): Promise<MFJSONType[]> => {
  const normalizedSearch = search.trim().toLowerCase();
  const cached = mfSearchCache.get(normalizedSearch);
  if (cached) return cached;
  const sessionCached = getSessionItem<MFJSONType[]>('mf_search_' + normalizedSearch);
  if (sessionCached && Array.isArray(sessionCached) && sessionCached.length > 0) {
    mfSearchCache.set(normalizedSearch, sessionCached);
    return sessionCached;
  }
  const pending = mfSearchRequests.get(normalizedSearch);
  if (pending) return pending;
  const request = (async () => {
    try {
      recordApiUsage();
      const data = await searchMutualFundsAction(normalizedSearch);
      const filteredData = Array.from(new Map(data.map((fund) => [fund.schemeCode, fund])).values());
      const sortedData = filteredData.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
      mfSearchCache.set(normalizedSearch, sortedData);
      setSessionItem('mf_search_' + normalizedSearch, sortedData);
      if (mfSearchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
        const oldestKey = mfSearchCache.keys().next().value;
        if (oldestKey) mfSearchCache.delete(oldestKey);
      }
      return sortedData;
    } catch {
      throw new Error('Failed to fetch mutual funds');
    } finally {
      mfSearchRequests.delete(normalizedSearch);
    }
  })();
  mfSearchRequests.set(normalizedSearch, request);
  return request;
};
export const fetchMFWithMeta = async (
  schemeCode: string,
  endDate?: string | null
): Promise<MFDetailsResult> => {
  const cached = mfDetailsCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now() && historySatisfies(cached.data.data, endDate)) {
    return cached.data;
  }
  recordApiUsage();
  // Forwarding the date lets the server lower its own ceiling for a past date
  // and answer from cache instead of going upstream.
  let rawData = await getMutualFundNavAction(schemeCode, endDate);
  if (typeof rawData === 'string') {
    try { rawData = JSON.parse(rawData); } catch { /* ignore non-JSON */ }
  }
  const parsed = rawData as {
    data?: NavType[];
    meta?: MFMetaType;
    error?: string;
    marketAsOf?: string;
  };
  if (!parsed || !Array.isArray(parsed.data)) {
    throw new Error(parsed?.error ?? 'Mutual fund response did not contain NAV data');
  }
  rememberMarketAsOf(parsed);
  const result: MFDetailsResult = { data: parsed.data, meta: parsed.meta };
  mfDetailsCache.set(schemeCode, { expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS, data: result });
  mfNavCache.set(schemeCode, { expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS, data: parsed.data });
  setSessionItem('mf_nav_' + schemeCode, parsed.data);
  return result;
};
export const fetchMFbySchemeCode = async (
  schemeCode: string,
  endDate?: string | null,
  _signal?: AbortSignal
): Promise<NavType[]> => {
  const details = mfDetailsCache.get(schemeCode);
  if (details && details.expiresAt > Date.now() && historySatisfies(details.data.data, endDate)) {
    return details.data.data;
  }
  const cached = mfNavCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now() && historySatisfies(cached.data, endDate)) {
    return cached.data;
  }
  // `getSessionItem` enforces its own max age, but age was never the problem:
  // this tier returned any non-empty array regardless of how far it reached.
  const sessionCached = getSessionItem<NavType[]>('mf_nav_' + schemeCode);
  if (historySatisfies(sessionCached ?? undefined, endDate)) {
    const rows = sessionCached as NavType[];
    mfNavCache.set(schemeCode, { expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS, data: rows });
    return rows;
  }
  // In-flight dedup is keyed by scheme and date: two components asking for
  // different dates must not share one promise.
  const requestKey = `${schemeCode}|${endDate ?? ''}`;
  const pending = mfNavRequests.get(requestKey);
  if (pending) return pending;
  const request = (async (): Promise<NavType[]> => {
    recordApiUsage();
    let rawData = await getMutualFundNavAction(schemeCode, endDate);
    if (typeof rawData === 'string') {
      try { rawData = JSON.parse(rawData); } catch { /* ignore non-JSON */ }
    }
    const data = rawData as {
      data?: NavType[];
      meta?: MFMetaType;
      error?: string;
      marketAsOf?: string;
    };
    if (!data || !Array.isArray(data.data)) {
      throw new Error(data?.error ?? 'Mutual fund response did not contain NAV data');
    }
    rememberMarketAsOf(data);
    if (data.meta) {
      mfDetailsCache.set(schemeCode, { expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS, data: { data: data.data, meta: data.meta } });
    }
    mfNavCache.set(schemeCode, { expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS, data: data.data });
    setSessionItem('mf_nav_' + schemeCode, data.data);
    return data.data;
  })();
  mfNavRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    mfNavRequests.delete(requestKey);
  }
};
