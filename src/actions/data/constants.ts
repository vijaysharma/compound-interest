export const OPEN_EXCHANGE_API = 'https://open.er-api.com/v6/latest';
export const WORLD_BANK_PPP_API =
  'https://api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP?format=json&per_page=400&mrv=1&gapfill=y';
export const DB_TTL_MS = 24 * 60 * 60 * 1000;
export const PPP_DB_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const NAV_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
export const NAV_IN_MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SEARCH_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SEARCH_IN_MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const memoryState: {
  exchangeRates: { rates: Record<string, number>; timestamp: number } | null;
  pppData: { data: unknown; timestamp: number } | null;
  imfData: { data: unknown; timestamp: number } | null;
} = {
  exchangeRates: null,
  pppData: null,
  imfData: null,
};
export const mfSearchCache = new Map<string, { expiresAt: number; data: unknown[] }>();
export const mfNavCache = new Map<string, { expiresAt: number; data: unknown }>();
export function parseNavPayload(val: unknown): { data: unknown[]; [k: string]: unknown } | null {
  if (!val) return null;
  let parsed = val;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown }).data)) {
    return parsed as { data: unknown[]; [k: string]: unknown };
  }
  return null;
}
export function getLatestNavDateISO(payload: unknown): string | null {
  const parsed = parseNavPayload(payload);
  if (!parsed || !Array.isArray(parsed.data) || parsed.data.length === 0) {
    return null;
  }
  let maxTime = -Infinity;
  let latestIso = '';
  for (const item of parsed.data as Array<{ date?: string; nav?: string }>) {
    if (!item || !item.date) continue;
    const parts = item.date.split('-');
    if (parts.length === 3) {
      let y: number, m: number, d: number;
      if (parts[0].length === 4) {
        y = Number(parts[0]);
        m = Number(parts[1]);
        d = Number(parts[2]);
      } else {
        d = Number(parts[0]);
        m = Number(parts[1]);
        y = Number(parts[2]);
      }
      if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        const time = new Date(y, m - 1, d).getTime();
        if (time > maxTime) {
          maxTime = time;
          latestIso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
      }
    }
  }
  return latestIso || null;
}
