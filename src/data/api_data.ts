import {
  EXCHANGE_URL,
  getMFSchemeCodeUrl,
  IMF_INFLATION_URL,
  MF_URL,
  WORLD_BANK_INFLATION_URL,
  WORLD_BANK_PPP_URL,
} from './API_LIST';
import { MFJSONType } from '../types/types';
const mfSearchCache = new Map<string, MFJSONType[]>();
const mfNavCache = new Map<string, unknown[]>();
const mfNavRequests = new Map<string, Promise<unknown[]>>();
const MAX_SEARCH_CACHE_ENTRIES = 50;
const recordApiUsage = async () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) return;
    await fetch('/api/user/track-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.warn('Failed to record API usage:', err);
  }
};
export const fetchAllMfs = async (search = '', signal?: AbortSignal): Promise<MFJSONType[]> => {
  const normalizedSearch = search.trim().toLowerCase();
  const cached = mfSearchCache.get(normalizedSearch);
  if (cached) return cached;
  const request = (async () => {
    try {
      void recordApiUsage();
      const query = normalizedSearch ? `?q=${encodeURIComponent(normalizedSearch)}` : '';
      const response = await fetch(`${MF_URL}${query}`, { signal });
      const data = (await response.json()) as MFJSONType[];
      const filteredData = Array.from(
        new Map(data.map((fund: MFJSONType) => [fund.schemeCode, fund])).values()
      );
      //   Sort the data alphabetically by schemeName
      const sortedData = filteredData.sort(
        (a: { schemeName: string }, b: { schemeName: string }) => {
          if (a.schemeName < b.schemeName) {
            return -1;
          }
          if (a.schemeName > b.schemeName) {
            return 1;
          }
          return 0;
        }
      );
      mfSearchCache.set(normalizedSearch, sortedData);
      if (mfSearchCache.size > MAX_SEARCH_CACHE_ENTRIES) {
        const oldestKey = mfSearchCache.keys().next().value;
        if (oldestKey) mfSearchCache.delete(oldestKey);
      }
      return sortedData;
    } catch {
      throw Error(`Failed to fetch mutual funds at this url ${MF_URL}`);
    }
  })();
  return request;
};
export const fetchMFbySchemeCode = async (schemeCode: string, signal?: AbortSignal) => {
  const cached = mfNavCache.get(schemeCode);
  if (cached) return cached;
  const pending = mfNavRequests.get(schemeCode);
  if (pending) return pending;
  const request = (async () => {
    void recordApiUsage();
    const response = await fetch(getMFSchemeCodeUrl(schemeCode), { signal });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? `Mutual fund request failed: ${response.status}`);
    }
    if (!Array.isArray(data.data)) {
      throw new Error('Mutual fund response did not contain NAV data');
    }
    mfNavCache.set(schemeCode, data.data);
    return data.data;
  })();
  mfNavRequests.set(schemeCode, request);
  try {
    return await request;
  } finally {
    mfNavRequests.delete(schemeCode);
  }
};
export const fetchExchangeRates = async () => {
  void recordApiUsage();
  const response = await fetch(EXCHANGE_URL);
  const data = await response.json();
  return data.rates;
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
  const res = await fetch(WORLD_BANK_PPP_URL);
  if (!res.ok) {
    throw new Error(`World Bank PPP API request failed: ${res.status}`);
  }
  // The API's JSON response is a 2-element array: [metadata, records[]]
  const [, records] = (await res.json()) as [unknown, WorldBankPPPRecord[] | null];
  const data = records ?? [];
  pppCache = { data, fetchedAt: Date.now() };
  return data;
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
// Maps the World Bank's country.value string to the column key used in
// InflationRow / your existing INFLATION rows.
const COUNTRY_NAME_TO_COLUMN: Record<string, keyof Omit<InflationRow, 'Year' | 'id'>> = {
  India: 'India',
  'United States': 'USA',
  'European Union': 'EU',
  World: 'World',
};
// Maps IMF's country/group codes to the same column keys used above.
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
async function fetchWorldBankRecords(): Promise<WorldBankInflationRecord[]> {
  const res = await fetch(WORLD_BANK_INFLATION_URL);
  if (!res.ok) {
    throw new Error(`World Bank inflation API request failed: ${res.status}`);
  }
  // Response is a 2-element array: [metadata, records[]]
  const [, records] = (await res.json()) as [unknown, WorldBankInflationRecord[] | null];
  return records ?? [];
}
async function fetchIMFEstimates(): Promise<IMFDataMapperResponse> {
  const res = await fetch(IMF_INFLATION_URL);
  if (!res.ok) {
    throw new Error(`Stored IMF data request failed: ${res.status}`);
  }
  return (await res.json()) as IMFDataMapperResponse;
}
/**
 * Fetches India/USA/EU/World inflation, blending two sources:
 *  - World Bank (FP.CPI.TOTL.ZG): confirmed historical values.
 *  - IMF DataMapper (PCPIPCH): includes the current year and near-term
 *    projections, used ONLY to fill in years the World Bank doesn't have yet.
 *
 * World Bank values always win when both sources have a year, since they're
 * confirmed rather than estimated. Values sourced from the IMF are suffixed
 * with "*" (still numeric-parseable — "4.70%*" parses to 4.70 with
 * parseFloat) so the UI can flag them as estimates if desired.
 */
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
  // 1. Lay down confirmed World Bank values first.
  for (const rec of wbRecords) {
    const column = COUNTRY_NAME_TO_COLUMN[rec.country.value];
    if (!column || rec.value == null) continue;
    const row = ensureRow(rec.date);
    row[column] = `${rec.value.toFixed(2)}%`;
  }
  // 2. Fill gaps (typically just the current year) with IMF estimates,
  //    without overwriting any confirmed World Bank value.
  const pcpipch = imfData.values?.PCPIPCH ?? {};
  for (const [code, yearMap] of Object.entries(pcpipch)) {
    const column = IMF_CODE_TO_COLUMN[code];
    if (!column) continue;
    for (const [year, value] of Object.entries(yearMap)) {
      if (value == null) continue;
      const row = ensureRow(year);
      if (row[column] === 'NA') {
        row[column] = `${value.toFixed(2)}%*`; // "*" marks an IMF estimate
      }
    }
  }
  const data = Object.values(rowsByYear).sort((a, b) => b.Year - a.Year);
  cache = { data, fetchedAt: Date.now() };
  return data;
}
