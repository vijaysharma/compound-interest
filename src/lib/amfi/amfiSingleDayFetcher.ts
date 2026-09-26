import { formatAmfiDate, parseAmfiDate } from './amfiDate';
import type { AmfiNavRecord } from './amfiNavTypes';
const AMFI_HISTORY_URL = 'https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx';
export function parseAmfiRawTextToRecords(text: string, allowedCodes?: Set<string>): AmfiNavRecord[] {
  const records: AmfiNavRecord[] = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !/^\d{1,10};/.test(trimmed)) continue;
    const parts = trimmed.split(';').map((p) => p.trim());
    if (parts.length < 5) continue;
    const schemeCode = parts[0];
    if (allowedCodes && !allowedCodes.has(schemeCode)) continue;
    let navStr = '';
    let dateStr = '';
    if (parts.length >= 8) {
      navStr = parts[6];
      dateStr = parts[7];
    } else if (parts.length >= 6) {
      navStr = parts[parts.length - 2];
      dateStr = parts[parts.length - 1];
    } else {
      continue;
    }
    const nav = parseFloat(navStr.replace(/,/g, ''));
    if (!Number.isFinite(nav) || nav <= 0) continue;
    const parsedDate = parseAmfiDate(dateStr);
    if (!parsedDate) continue;
    let schemeName = parts[1] && isNaN(Number(parts[1])) && !parts[1].startsWith('INF') ? parts[1] : parts[3] || `Scheme ${schemeCode}`;
    if (parts.length >= 8) {
      const plan = parts[4];
      const option = parts[5];
      if (plan && !schemeName.toLowerCase().includes(plan.toLowerCase())) schemeName += ` - ${plan}`;
      if (option && !schemeName.toLowerCase().includes(option.toLowerCase())) schemeName += ` - ${option}`;
    }
    records.push({ schemeCode, schemeName, nav, date: parsedDate.isoDate });
  }
  return records;
}
export async function fetchAmfiSingleDay(
  isoDate: string,
  allowedCodes?: Set<string>,
  timeoutMs = 15_000
): Promise<AmfiNavRecord[]> {
  const amfiDate = formatAmfiDate(isoDate);
  const params = new URLSearchParams({ frmdt: amfiDate, todt: amfiDate });
  const url = `${AMFI_HISTORY_URL}?${params.toString()}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/plain,*/*' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`AMFI returned HTTP ${res.status}`);
  const text = await res.text();
  return parseAmfiRawTextToRecords(text, allowedCodes);
}
export async function fetchTradingDayWithFallback(
  targetIsoDate: string,
  allowedCodes?: Set<string>,
  maxLookbackDays = 5
): Promise<{ records: AmfiNavRecord[]; syncedDate: string; isFallback: boolean }> {
  let currentDate = targetIsoDate;
  for (let i = 0; i <= maxLookbackDays; i++) {
    try {
      const records = await fetchAmfiSingleDay(currentDate, allowedCodes);
      if (records.length > 0) {
        return { records, syncedDate: currentDate, isFallback: currentDate !== targetIsoDate };
      }
    } catch {
      // Continue to previous day on network/AMFI error
    }
    const d = new Date(`${currentDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    currentDate = d.toISOString().slice(0, 10);
  }
  return { records: [], syncedDate: targetIsoDate, isFallback: false };
}
