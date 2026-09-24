import { MFJSONType, NavType } from '../../types/types';
import { getMutualFundNavAction, searchMutualFundsAction } from '@/actions/data';
import { CLIENT_NAV_CACHE_TTL_MS, getSessionItem, recordApiUsage, setSessionItem } from './clientStorage';
import {
  historySatisfies,
  rememberMarketAsOf,
  type MFDetailsResult,
  type MFMetaType,
} from './mfHistoryCache';
export type { MFDetailsResult, MFMetaType } from './mfHistoryCache';
export { historySatisfies } from './mfHistoryCache';
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
  const sessionCached = getSessionItem<NavType[]>('mf_nav_' + schemeCode);
  if (historySatisfies(sessionCached ?? undefined, endDate)) {
    const rows = sessionCached as NavType[];
    mfNavCache.set(schemeCode, { expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS, data: rows });
    return rows;
  }
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
