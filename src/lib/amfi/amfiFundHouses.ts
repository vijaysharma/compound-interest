import { redisGet, redisSet } from '../redis';
import { formatAmfiDate } from './amfiDate';
import { fetchAmfiHistoricalChunk } from './amfiClient';
/**
 * AMFI's NAV history report filters by fund house (`mf=<code>`), never by scheme, so a per-scheme
 * history fetch needs the scheme's fund-house code. Codes probed from the report on 2026-10-06; the
 * keys are the fund-house headings exactly as NAVAll.txt prints them. Gaps are AMCs that no longer
 * publish. New AMCs are numbered after the highest code, which is what discovery probes for.
 */
const AMFI_FUND_HOUSE_CODES = new Map<string, number>([
  ['Aditya Birla Sun Life Mutual Fund', 3],
  ['Baroda BNP Paribas Mutual Fund', 4],
  ['DSP Mutual Fund', 6],
  ['HDFC Mutual Fund', 9],
  ['quant Mutual Fund', 13],
  ['JM Financial Mutual Fund', 16],
  ['Kotak Mahindra Mutual Fund', 17],
  ['LIC Mutual Fund', 18],
  ['ICICI Prudential Mutual Fund', 20],
  ['Nippon India Mutual Fund', 21],
  ['SBI Mutual Fund', 22],
  ['Tata Mutual Fund', 25],
  ['Taurus Mutual Fund', 26],
  ['Franklin Templeton Mutual Fund', 27],
  ['UTI Mutual Fund', 28],
  ['Canara Robeco Mutual Fund', 32],
  ['Sundaram Mutual Fund', 33],
  ['HSBC Mutual Fund', 37],
  ['Quantum Mutual Fund', 41],
  ['Invesco Mutual Fund', 42],
  ['Mirae Asset Mutual Fund', 45],
  ['Bank of India Mutual Fund', 46],
  ['Edelweiss Mutual Fund', 47],
  ['Bandhan Mutual Fund', 48],
  ['Axis Mutual Fund', 53],
  ['Navi Mutual Fund', 54],
  ['Motilal Oswal Mutual Fund', 55],
  ['PGIM India Mutual Fund', 58],
  ['Union Mutual Fund', 61],
  ['360 ONE Mutual Fund', 62],
  ['Groww Mutual Fund', 63],
  ['PPFAS Mutual Fund', 64],
  ['IL&FS Mutual Fund (IDF)', 65],
  ['Shriram Mutual Fund', 67],
  ['Mahindra Manulife Mutual Fund', 69],
  ['ITI Mutual Fund', 70],
  ['WhiteOak Capital Mutual Fund', 71],
  ['Trust Mutual Fund', 72],
  ['NJ Mutual Fund', 73],
  ['Samco Mutual Fund', 74],
  ['Bajaj Finserv Mutual Fund', 75],
  ['Helios Mutual Fund', 76],
  ['Zerodha Mutual Fund', 77],
  ['Old Bridge Mutual Fund', 78],
  ['Unifi Mutual Fund', 79],
  ['Angel One Mutual Fund', 80],
  ['Capitalmind Mutual Fund', 81],
  ['Jio BlackRock Mutual Fund', 82],
  ['The Wealth Company Mutual Fund', 83],
  ['Choice Mutual Fund', 84],
  ['Abakkus Mutual Fund', 85],
  ['AlphaGrep Mutual Fund', 86],
  ['ASK MUTUAL FUND', 87],
  ['Lakshya Mutual Fund', 88],
  ['Monarch Mutual Fund', 89],
]);
const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();
const KNOWN_CODES = new Map(
  [...AMFI_FUND_HOUSE_CODES].map(([name, code]) => [normalize(name), code] as const)
);
const MAX_KNOWN_CODE = Math.max(...AMFI_FUND_HOUSE_CODES.values());
const DISCOVERY_PROBES = 8;
const DISCOVERED_KEY = 'amfi:fund-house-codes:discovered';
const DISCOVERED_TTL_SECONDS = 30 * 24 * 60 * 60;
const DISCOVERY_TIMEOUT_MS = 10_000;
/**
 * The `mf` code for a fund house, or null when it can't be found. An unknown house (a newly
 * registered AMC) is looked for among the next few codes after the highest known one; whatever
 * those probes find is remembered for a month.
 */
export async function resolveAmfiFundHouseCode(fundHouse: string): Promise<number | null> {
  const key = normalize(fundHouse);
  const known = KNOWN_CODES.get(key);
  if (known) return known;
  const discovered = (await redisGet<Record<string, number>>(DISCOVERED_KEY)) ?? {};
  if (discovered[key]) return discovered[key];
  const to = new Date();
  const from = new Date(to.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fromAmfi = formatAmfiDate(from.toISOString().slice(0, 10));
  const toAmfi = formatAmfiDate(to.toISOString().slice(0, 10));
  const codes = Array.from({ length: DISCOVERY_PROBES }, (_, i) => MAX_KNOWN_CODE + 1 + i);
  const headings = await Promise.all(
    codes.map(async (code) => {
      try {
        const parsed = await fetchAmfiHistoricalChunk(
          fromAmfi,
          toAmfi,
          String(code),
          DISCOVERY_TIMEOUT_MS
        );
        return parsed.fundHouses[0] ?? null;
      } catch {
        return null;
      }
    })
  );
  codes.forEach((code, i) => {
    const heading = headings[i];
    if (heading) discovered[normalize(heading)] = code;
  });
  await redisSet(DISCOVERED_KEY, discovered, DISCOVERED_TTL_SECONDS).catch(() => false);
  return discovered[key] ?? null;
}
