import { parseAmfiText } from './amfiParser';
import { generateAmfiChunks } from './amfiChunker';
import type { AmfiParseResult } from './amfiTypes';
const AMFI_LATEST_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';
const AMFI_HISTORICAL_URL = 'https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx';
const DEFAULT_TIMEOUT_MS = 20_000;
async function fetchWithRetry(url: string, timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = 2): Promise<string> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', Accept: 'text/plain,*/*' },
        signal: AbortSignal.timeout(timeoutMs),
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`AMFI returned HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}
let latestCache: { result: AmfiParseResult; timestamp: number } | null = null;
let pendingLatest: Promise<AmfiParseResult> | null = null;
const LATEST_CACHE_TTL_MS = 5 * 60 * 1000;
export async function fetchAmfiLatest(timeoutMs = DEFAULT_TIMEOUT_MS, force = false): Promise<AmfiParseResult> {
  if (!force && latestCache && Date.now() - latestCache.timestamp < LATEST_CACHE_TTL_MS) {
    return latestCache.result;
  }
  if (pendingLatest) return pendingLatest;
  pendingLatest = (async () => {
    try {
      const text = await fetchWithRetry(AMFI_LATEST_URL, timeoutMs);
      const result = parseAmfiText(text);
      latestCache = { result, timestamp: Date.now() };
      return result;
    } finally {
      pendingLatest = null;
    }
  })();
  return pendingLatest;
}
export async function fetchAmfiHistoricalChunk(
  fromAmfi: string,
  toAmfi: string,
  mfCode?: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<AmfiParseResult> {
  const params = new URLSearchParams({ frmdt: fromAmfi, todt: toAmfi });
  if (mfCode) params.set('mf', mfCode);
  const url = `${AMFI_HISTORICAL_URL}?${params.toString()}`;
  const text = await fetchWithRetry(url, timeoutMs);
  return parseAmfiText(text);
}
export async function fetchAmfiHistoricalRange(
  fromIso: string,
  toIso: string,
  mfCode?: string
): Promise<AmfiParseResult> {
  const chunks = generateAmfiChunks(fromIso, toIso);
  const combined: AmfiParseResult = {
    records: [],
    byScheme: new Map(),
    schemes: new Map(),
    skippedLines: 0,
  };
  for (const chunk of chunks) {
    try {
      const chunkResult = await fetchAmfiHistoricalChunk(chunk.fromAmfi, chunk.toAmfi, mfCode);
      combined.skippedLines += chunkResult.skippedLines;
      for (const [code, rows] of chunkResult.byScheme) {
        if (!combined.byScheme.has(code)) combined.byScheme.set(code, []);
        combined.byScheme.get(code)!.push(...rows);
      }
      for (const [code, meta] of chunkResult.schemes) {
        if (!combined.schemes.has(code)) combined.schemes.set(code, meta);
      }
      combined.records.push(...chunkResult.records);
    } catch (err) {
      console.warn(`[amfi] Historical chunk ${chunk.fromAmfi} to ${chunk.toAmfi} failed:`, err);
    }
  }
  return combined;
}
