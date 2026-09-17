import { MFJSONType, NavType } from '../types/types';
import { DEFAULT_PPP_RECORDS } from './default_ppp_data';
import { DEFAULT_EXCHANGE_RATES } from './default_exchange_rates';
import {
  getBatchMutualFundNavAction,
  getExchangeRatesAction,
  getIMFInflationAction,
  getMutualFundNavAction,
  getPPPDataAction,
  searchMutualFundsAction,
} from '@/actions/data';
import { trackUsageAction } from '@/actions/auth';
const mfSearchCache = new Map<string, MFJSONType[]>();
const mfNavCache = new Map<string, { expiresAt: number; data: NavType[] }>();
const mfNavRequests = new Map<string, Promise<NavType[]>>();
const mfSearchRequests = new Map<string, Promise<MFJSONType[]>>();
const MAX_SEARCH_CACHE_ENTRIES = 200;
const CLIENT_NAV_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // Indefinite / 30-day client cache
function getSessionItem<T>(key: string, maxAgeMs = 30 * 24 * 60 * 60 * 1000): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: T };
    if (Date.now() - parsed.ts < maxAgeMs) {
      return parsed.data;
    }
  } catch {
    // Ignore sessionStorage read errors
  }
  return null;
}
function setSessionItem<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore sessionStorage quota errors
  }
}
let usageTimeout: ReturnType<typeof setTimeout> | null = null;
const recordApiUsage = () => {
  if (usageTimeout) return;
  usageTimeout = setTimeout(async () => {
    usageTimeout = null;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return;
      await trackUsageAction(token, 'api');
    } catch (err) {
      console.warn('Failed to record API usage:', err);
    }
  }, 3000);
};
export const fetchAllMfs = async (search = '', _signal?: AbortSignal): Promise<MFJSONType[]> => {
  const normalizedSearch = search.trim().toLowerCase();
  const cached = mfSearchCache.get(normalizedSearch);
  if (cached) return cached;
  // Check sessionStorage for instant retrieval on page reload
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
      const filteredData = Array.from(
        new Map(data.map((fund) => [fund.schemeCode, fund])).values()
      );
      const sortedData = filteredData.sort((a, b) => {
        if (a.schemeName < b.schemeName) return -1;
        if (a.schemeName > b.schemeName) return 1;
        return 0;
      });
      mfSearchCache.set(normalizedSearch, sortedData);
      setSessionItem('mf_search_' + normalizedSearch, sortedData);
      if (mfSearchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
        const oldestKey = mfSearchCache.keys().next().value;
        if (oldestKey) mfSearchCache.delete(oldestKey);
      }
      return sortedData;
    } catch {
      throw new Error(`Failed to fetch mutual funds`);
    } finally {
      mfSearchRequests.delete(normalizedSearch);
    }
  })();
  mfSearchRequests.set(normalizedSearch, request);
  return request;
};
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
const mfDetailsCache = new Map<string, { expiresAt: number; data: MFDetailsResult }>();
export const fetchMFWithMeta = async (schemeCode: string): Promise<MFDetailsResult> => {
  const cached = mfDetailsCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  recordApiUsage();
  let rawData = await getMutualFundNavAction(schemeCode);
  if (typeof rawData === 'string') {
    try {
      rawData = JSON.parse(rawData);
    } catch {
      // Ignore non-JSON string
    }
  }
  const parsed = rawData as {
    data?: NavType[];
    meta?: MFMetaType;
    error?: string;
  };
  if (!parsed || !Array.isArray(parsed.data)) {
    throw new Error(parsed?.error ?? 'Mutual fund response did not contain NAV data');
  }
  const result: MFDetailsResult = {
    data: parsed.data,
    meta: parsed.meta,
  };
  mfDetailsCache.set(schemeCode, {
    expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
    data: result,
  });
  // Also sync with nav cache and sessionStorage
  mfNavCache.set(schemeCode, {
    expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
    data: parsed.data,
  });
  setSessionItem('mf_nav_' + schemeCode, parsed.data);
  return result;
};
export const fetchMFbySchemeCode = async (schemeCode: string, _signal?: AbortSignal): Promise<NavType[]> => {
  const details = mfDetailsCache.get(schemeCode);
  if (details && details.expiresAt > Date.now()) return details.data.data;
  const cached = mfNavCache.get(schemeCode);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  // Check sessionStorage for instant (0ms) reload
  const sessionCached = getSessionItem<NavType[]>('mf_nav_' + schemeCode);
  if (sessionCached && Array.isArray(sessionCached) && sessionCached.length > 0) {
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
      data: sessionCached,
    });
    return sessionCached;
  }
  const pending = mfNavRequests.get(schemeCode);
  if (pending) return pending;
  const request = (async (): Promise<NavType[]> => {
    recordApiUsage();
    let rawData = await getMutualFundNavAction(schemeCode);
    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        // Ignore non-JSON string
      }
    }
    const data = rawData as {
      data?: NavType[];
      meta?: MFMetaType;
      error?: string;
    };
    if (!data || !Array.isArray(data.data)) {
      throw new Error(data?.error ?? 'Mutual fund response did not contain NAV data');
    }
    if (data.meta) {
      mfDetailsCache.set(schemeCode, {
        expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
        data: { data: data.data, meta: data.meta },
      });
    }
    mfNavCache.set(schemeCode, {
      expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
      data: data.data,
    });
    setSessionItem('mf_nav_' + schemeCode, data.data);
    return data.data;
  })();
  mfNavRequests.set(schemeCode, request);
  try {
    return await request;
  } finally {
    mfNavRequests.delete(schemeCode);
  }
};
/**
 * High-performance batch fetcher for multiple pinned mutual funds.
 * Resolves all funds in a single server action call instead of multiple parallel requests.
 */
export const fetchBatchMFbySchemeCodes = async (
  schemeCodes: (string | number)[]
): Promise<Record<string, NavType[]>> => {
  const result: Record<string, NavType[]> = {};
  if (!Array.isArray(schemeCodes) || schemeCodes.length === 0) return result;
  const missingCodes: string[] = [];
  for (const rawCode of schemeCodes) {
    const code = String(rawCode).trim();
    if (!code || code === '0') continue;
    // 1. Check in-memory cache
    const cached = mfNavCache.get(code);
    if (cached && cached.expiresAt > Date.now()) {
      result[code] = cached.data;
      continue;
    }
    // 2. Check sessionStorage
    const sessionCached = getSessionItem<NavType[]>('mf_nav_' + code);
    if (sessionCached && Array.isArray(sessionCached) && sessionCached.length > 0) {
      mfNavCache.set(code, {
        expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
        data: sessionCached,
      });
      result[code] = sessionCached;
      continue;
    }
    missingCodes.push(code);
  }
  if (missingCodes.length === 0) {
    return result;
  }
  recordApiUsage();
  try {
    const batchData = await getBatchMutualFundNavAction(missingCodes);
    for (const [code, rawPayload] of Object.entries(batchData)) {
      let parsed = rawPayload;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // Keep raw object if not JSON string
        }
      }
      const data = parsed as { data?: NavType[]; meta?: MFMetaType };
      if (data && Array.isArray(data.data)) {
        result[code] = data.data;
        mfNavCache.set(code, {
          expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
          data: data.data,
        });
        setSessionItem('mf_nav_' + code, data.data);
        if (data.meta) {
          mfDetailsCache.set(code, {
            expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
            data: { data: data.data, meta: data.meta },
          });
        }
      }
    }
    const stillUnresolved = missingCodes.filter((c) => !result[c] || result[c].length === 0);
    if (stillUnresolved.length > 0) {
      await Promise.all(
        stillUnresolved.map(async (code) => {
          try {
            const navData = await fetchMFbySchemeCode(code);
            if (Array.isArray(navData) && navData.length > 0) {
              result[code] = navData;
            }
          } catch {
            // Ignore individual fetch failure
          }
        })
      );
    }
  } catch (err) {
    console.warn('Batch mutual fund NAV fetch failed, falling back to individual:', err);
    await Promise.all(
      missingCodes.map(async (code) => {
        try {
          const navData = await fetchMFbySchemeCode(code);
          result[code] = navData;
        } catch {
          // Ignore individual fetch failure in batch fallback
        }
      })
    );
  }
  return result;
};
let exchangeRatesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const EXCHANGE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes client cache
export const fetchExchangeRates = async (recordUsage = false): Promise<Record<string, number>> => {
  if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < EXCHANGE_CACHE_TTL_MS) {
    if (recordUsage) void recordApiUsage();
    return exchangeRatesCache.rates;
  }
  if (recordUsage) void recordApiUsage();
  try {
    const data = await getExchangeRatesAction();
    if (data && data.rates && typeof data.rates === 'object' && Object.keys(data.rates).length > 0) {
      exchangeRatesCache = { rates: data.rates, timestamp: Date.now() };
      return data.rates;
    }
  } catch (err) {
    console.warn('Live exchange rates fetch failed, using fallback exchange rates:', err);
  }
  exchangeRatesCache = { rates: DEFAULT_EXCHANGE_RATES, timestamp: Date.now() };
  return DEFAULT_EXCHANGE_RATES;
};
// ----------------
export interface WorldBankPPPRecord {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}
let pppCache: { data: WorldBankPPPRecord[]; fetchedAt: number } | null = null;
const PPP_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
export async function fetchPPPData(): Promise<WorldBankPPPRecord[]> {
  if (pppCache && Date.now() - pppCache.fetchedAt < PPP_CACHE_TTL_MS) {
    return pppCache.data;
  }
  void recordApiUsage();
  try {
    const json = await getPPPDataAction();
    let records: WorldBankPPPRecord[] = [];
    if (Array.isArray(json)) {
      if (Array.isArray(json[1])) {
        records = json[1] as WorldBankPPPRecord[];
      } else {
        records = json as WorldBankPPPRecord[];
      }
    } else if (
      json &&
      typeof json === 'object' &&
      Array.isArray((json as { records?: unknown }).records)
    ) {
      records = (json as { records: WorldBankPPPRecord[] }).records;
    }
    const data = records.length > 0 ? records : (DEFAULT_PPP_RECORDS as unknown as WorldBankPPPRecord[]);
    pppCache = { data, fetchedAt: Date.now() };
    return data;
  } catch (err) {
    console.warn('Using fallback PPP data:', err);
    pppCache = { data: DEFAULT_PPP_RECORDS as unknown as WorldBankPPPRecord[], fetchedAt: Date.now() };
    return DEFAULT_PPP_RECORDS as unknown as WorldBankPPPRecord[];
  }
}
// ------------------
export interface WorldBankInflationRecord {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  countryiso3code: string;
  date: string; // year, e.g. "2025"
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}
export interface InflationRow {
  Year: number;
  id: number;
  India: string;
  EU: string;
  USA: string;
  World: string;
}
const COUNTRY_NAME_TO_COLUMN: Record<string, keyof Omit<InflationRow, 'Year' | 'id'>> = {
  India: 'India',
  'United States': 'USA',
  'European Union': 'EU',
  World: 'World',
};
const IMF_CODE_TO_COLUMN: Record<string, keyof Omit<InflationRow, 'Year' | 'id'>> = {
  IND: 'India',
  USA: 'USA',
  EU: 'EU',
  WEOWORLD: 'World',
};
interface IMFDataMapperResponse {
  values?: {
    PCPIPCH?: {
      [countryCode: string]: {
        [year: string]: number;
      };
    };
  };
}
let cache: { data: InflationRow[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const WORLD_BANK_INFLATION_URL =
  'https://api.worldbank.org/v2/country/IND;USA;EUU;WLD/indicator/FP.CPI.TOTL.ZG?format=json&per_page=1000&date=1990:2026';
async function fetchWorldBankRecords(): Promise<WorldBankInflationRecord[]> {
  const res = await fetch(WORLD_BANK_INFLATION_URL);
  if (!res.ok) {
    throw new Error(`World Bank inflation API request failed: ${res.status}`);
  }
  const [, records] = (await res.json()) as [unknown, WorldBankInflationRecord[] | null];
  return records ?? [];
}
async function fetchIMFEstimates(): Promise<IMFDataMapperResponse> {
  try {
    const data = await getIMFInflationAction();
    return data as IMFDataMapperResponse;
  } catch (err) {
    console.warn('IMF estimates fetch failed:', err);
    return { values: { PCPIPCH: {} } };
  }
}
export async function fetchInflationData(): Promise<InflationRow[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }
  const [wbRecords, imfData] = await Promise.all([fetchWorldBankRecords(), fetchIMFEstimates()]);
  const rowsByYear: { [year: string]: InflationRow } = {};
  const ensureRow = (year: string): InflationRow => {
    if (!rowsByYear[year]) {
      rowsByYear[year] = {
        Year: parseInt(year, 10),
        id: parseInt(year, 10),
        India: 'NA',
        EU: 'NA',
        USA: 'NA',
        World: 'NA',
      };
    }
    return rowsByYear[year];
  };
  for (const rec of wbRecords) {
    const column = COUNTRY_NAME_TO_COLUMN[rec.country.value];
    if (!column || rec.value == null) continue;
    const row = ensureRow(rec.date);
    row[column] = `${rec.value.toFixed(2)}%`;
  }
  const pcpipch = imfData.values?.PCPIPCH ?? {};
  for (const [code, yearMap] of Object.entries(pcpipch)) {
    const column = IMF_CODE_TO_COLUMN[code];
    if (!column) continue;
    for (const [year, value] of Object.entries(yearMap)) {
      if (value == null) continue;
      const row = ensureRow(year);
      if (row[column] === 'NA') {
        row[column] = `${value.toFixed(2)}%*`;
      }
    }
  }
  const data = Object.values(rowsByYear).sort((a, b) => b.Year - a.Year);
  cache = { data, fetchedAt: Date.now() };
  return data;
}
