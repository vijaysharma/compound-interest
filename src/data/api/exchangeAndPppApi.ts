import { DEFAULT_EXCHANGE_RATES } from '../default_exchange_rates';
import { DEFAULT_PPP_RECORDS } from '../default_ppp_data';
import { getExchangeRatesAction, getPPPDataAction } from '@/actions/data';
import { recordApiUsage } from './clientStorage';
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
