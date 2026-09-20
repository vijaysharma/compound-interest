import { getIMFInflationAction } from '@/actions/data';
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
