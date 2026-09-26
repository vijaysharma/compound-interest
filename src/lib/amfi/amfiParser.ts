import type { NavType } from '@/types/types';
import { parseAmfiDate } from './amfiDate';
import type { AmfiNavRecord, AmfiParseResult } from './amfiTypes';
function extractParts(line: string): string[] {
  return line.split(';').map((p) => p.trim());
}
function buildSchemeName(parts: string[]): string {
  if (parts.length >= 8) {
    const rawName = parts[3];
    const plan = parts[4];
    const option = parts[5];
    let name = rawName;
    if (plan && !name.toLowerCase().includes(plan.toLowerCase())) name += ` - ${plan}`;
    if (option && !name.toLowerCase().includes(option.toLowerCase())) name += ` - ${option}`;
    return name;
  }
  return parts[1] && isNaN(Number(parts[1])) && !parts[1].startsWith('INF') ? parts[1] : parts[3] || 'Unknown Scheme';
}
function parseAmfiRow(parts: string[]): AmfiNavRecord | null {
  if (parts.length < 5) return null;
  const schemeCode = parts[0];
  if (!/^\d{1,10}$/.test(schemeCode)) return null;
  let navStr = '';
  let dateStr = '';
  if (parts.length >= 8) {
    navStr = parts[6];
    dateStr = parts[7];
  } else if (parts.length >= 6) {
    dateStr = parts[parts.length - 1];
    navStr = parts[parts.length - 2];
  } else {
    return null;
  }
  const navNumeric = parseFloat(navStr.replace(/,/g, ''));
  if (!Number.isFinite(navNumeric) || navNumeric <= 0) return null;
  const parsedDate = parseAmfiDate(dateStr);
  if (!parsedDate) return null;
  const schemeName = buildSchemeName(parts);
  const isin1 = parts.find((p) => /^INF[A-Z0-9]{9}$/i.test(p)) ?? null;
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
  const schemes = new Map<string, { schemeCode: string; schemeName: string; isinGrowth: string | null }>();
  let skippedLines = 0;
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !/^\d{1,10};/.test(trimmed)) {
      skippedLines++;
      continue;
    }
    const record = parseAmfiRow(extractParts(trimmed));
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
      });
    }
  }
  return { records, byScheme, schemes, skippedLines };
}
