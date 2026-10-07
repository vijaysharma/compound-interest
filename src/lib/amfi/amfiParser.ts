import type { NavType } from '@/types/types';
import { parseAmfiDate } from './amfiDate';
import type { AmfiNavRecord, AmfiParseResult } from './amfiTypes';
function extractParts(line: string): string[] {
  return line.split(';').map((p) => p.trim());
}
/**
 * Column positions. AMFI's two files order them differently, and each says which it is in its
 * header row:
 *   NAVAll.txt:  Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;Scheme Name;Plan;Option;Net Asset Value;Date
 *   NAV history: Scheme Code;NAV Name;Plan;Option;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Net Asset Value;Date
 * Reading the history report with the NAVAll positions built names out of the option and ISIN
 * columns ("Growth - INF789F01XA0").
 */
interface AmfiColumns {
  name: number;
  plan: number;
  option: number;
  isin: number;
  nav: number;
  date: number;
}
const NAVALL_COLUMNS: AmfiColumns = { name: 3, plan: 4, option: 5, isin: 1, nav: 6, date: 7 };
function columnsFromHeader(line: string, fallback: AmfiColumns): AmfiColumns {
  const headers = extractParts(line).map((h) => h.toLowerCase());
  const find = (test: (h: string) => boolean) => headers.findIndex(test);
  const columns = {
    name: find((h) => h === 'scheme name' || h === 'nav name'),
    plan: find((h) => h === 'plan'),
    option: find((h) => h === 'option'),
    isin: find((h) => h.includes('isin') && h.includes('growth')),
    nav: find((h) => h === 'net asset value'),
    date: find((h) => h === 'date'),
  };
  return columns.name >= 0 && columns.nav >= 0 && columns.date >= 0 ? columns : fallback;
}
function buildSchemeName(parts: string[], columns: AmfiColumns): string {
  const rawName = parts[columns.name];
  if (!rawName) return 'Unknown Scheme';
  let name = rawName;
  for (const extra of [parts[columns.plan], parts[columns.option]]) {
    if (extra && extra !== '-' && !name.toLowerCase().includes(extra.toLowerCase())) name += ` - ${extra}`;
  }
  return name;
}
function parseAmfiRow(parts: string[], columns: AmfiColumns): AmfiNavRecord | null {
  if (parts.length < 5) return null;
  const schemeCode = parts[0];
  if (!/^\d{1,10}$/.test(schemeCode)) return null;
  let navStr = '';
  let dateStr = '';
  if (parts.length >= 8) {
    navStr = parts[columns.nav];
    dateStr = parts[columns.date];
  } else if (parts.length >= 6) {
    dateStr = parts[parts.length - 1];
    navStr = parts[parts.length - 2];
  } else {
    return null;
  }
  const navNumeric = parseFloat((navStr ?? '').replace(/,/g, ''));
  if (!Number.isFinite(navNumeric) || navNumeric <= 0) return null;
  const parsedDate = parseAmfiDate(dateStr ?? '');
  if (!parsedDate) return null;
  const schemeName =
    parts.length >= 8
      ? buildSchemeName(parts, columns)
      : parts[1] && isNaN(Number(parts[1])) && !parts[1].startsWith('INF')
        ? parts[1]
        : parts[3] || 'Unknown Scheme';
  const isinCandidate = parts[columns.isin];
  const isin1 =
    (isinCandidate && /^INF[A-Z0-9]{9}$/i.test(isinCandidate) ? isinCandidate : null) ??
    parts.find((p) => /^INF[A-Z0-9]{9}$/i.test(p)) ??
    null;
  return {
    schemeCode,
    schemeName,
    isinGrowth: isin1,
    isinReinvest: null,
    nav: navNumeric.toFixed(4),
    navNumeric,
    date: parsedDate.navDate,
    isoDate: parsedDate.isoDate,
  };
}
export function parseAmfiText(text: string): AmfiParseResult {
  const records: AmfiNavRecord[] = [];
  const byScheme = new Map<string, NavType[]>();
  const schemes: AmfiParseResult['schemes'] = new Map();
  const fundHouses: string[] = [];
  // Scheme rows are grouped under a fund-house heading ("quant Mutual Fund"), itself under a
  // category heading ("Open Ended Schemes(...)").
  let fundHouse: string | null = null;
  let columns = NAVALL_COLUMNS;
  let skippedLines = 0;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !/^\d{1,10};/.test(trimmed)) {
      if (/^scheme code;/i.test(trimmed)) columns = columnsFromHeader(trimmed, NAVALL_COLUMNS);
      if (!trimmed.includes(';') && /mutual fund/i.test(trimmed) && !/schemes/i.test(trimmed)) {
        fundHouse = trimmed;
        if (!fundHouses.includes(trimmed)) fundHouses.push(trimmed);
      }
      skippedLines++;
      continue;
    }
    const record = parseAmfiRow(extractParts(trimmed), columns);
    if (!record) {
      skippedLines++;
      continue;
    }
    records.push(record);
    if (!byScheme.has(record.schemeCode)) byScheme.set(record.schemeCode, []);
    byScheme.get(record.schemeCode)!.push({ date: record.date, nav: record.nav });
    if (!schemes.has(record.schemeCode)) {
      schemes.set(record.schemeCode, {
        schemeCode: record.schemeCode,
        schemeName: record.schemeName,
        isinGrowth: record.isinGrowth,
        fundHouse,
      });
    }
  }
  return { records, byScheme, schemes, fundHouses, skippedLines };
}
