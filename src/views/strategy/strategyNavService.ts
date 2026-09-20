import { getBatchMutualFundNavAction } from '@/actions/data';
const KNOWN_BASE_NAVS: Record<string, number> = {
  '119551': 255.42,
  '120503': 142.85,
  '120828': 58.20,
  '125354': 188.75,
};
const navCache = new Map<string, number>();
export function getCachedNav(schemeCode: string): number {
  if (navCache.has(schemeCode)) {
    return navCache.get(schemeCode)!;
  }
  return KNOWN_BASE_NAVS[schemeCode] || 100;
}
export async function syncFundNavs(schemeCodes: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const neededCodes = schemeCodes.filter((code) => /^\d+$/.test(code));
  if (neededCodes.length === 0) return result;
  try {
    const rawPayload = await getBatchMutualFundNavAction(neededCodes);
    if (rawPayload && typeof rawPayload === 'object') {
      for (const code of neededCodes) {
        const item = rawPayload[code];
        if (item && typeof item === 'object' && Array.isArray((item as { data?: unknown[] }).data)) {
          const dataArr = (item as { data: Array<{ nav?: string | number }> }).data;
          if (dataArr.length > 0 && dataArr[0]?.nav) {
            const parsed = parseFloat(String(dataArr[0].nav));
            if (!isNaN(parsed) && parsed > 0) {
              navCache.set(code, parsed);
              result[code] = parsed;
            }
          }
        }
      }
    }
  } catch {
    // Graceful fallback to cached / base NAVs
  }
  for (const code of schemeCodes) {
    if (!result[code]) {
      result[code] = getCachedNav(code);
    }
  }
  return result;
}
