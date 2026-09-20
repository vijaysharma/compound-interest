import { getPostcodeDetailsAction } from '../../../actions/admin';
import type { PincodeInfo } from './types';
const pincodeCache = new Map<string, PincodeInfo>();
export function formatLocation(localities: string[], city?: string, state?: string): PincodeInfo {
  const cleanLocs = Array.from(
    new Set(localities.map((l) => l?.trim()).filter((l): l is string => Boolean(l && l.length > 0)))
  );
  const cleanCity = city?.trim() || '';
  const cleanState = state?.trim() || '';
  const locSummary =
    cleanLocs.length > 2
      ? `${cleanLocs.slice(0, 4).join(', ')} (+${cleanLocs.length - 4} more)`
      : cleanLocs.join(', ');
  const parts = [locSummary, cleanCity, cleanState].filter(
    (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
  );
  const fullParts = [cleanLocs.join(', '), cleanCity, cleanState].filter(
    (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
  );
  return {
    display: parts.join(', '),
    tooltip: cleanLocs.length > 2 ? fullParts.join(', ') : undefined,
  };
}
export function parseShiprocketData(data: unknown): PincodeInfo | null {
  if (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    (data as { success: boolean }).success &&
    'postcode_details' in data
  ) {
    const details = (
      data as { postcode_details?: { city?: string; state?: string; locality?: unknown } }
    ).postcode_details;
    if (details) {
      const { city, state, locality } = details;
      const locList: string[] = Array.isArray(locality)
        ? locality.map(String)
        : locality
          ? [String(locality)]
          : [];
      const result = formatLocation(locList, city, state);
      if (result.display) {
        return result;
      }
    }
  }
  return null;
}
export async function lookupPincode(code: string, signal?: AbortSignal): Promise<PincodeInfo | null> {
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return null;
  if (pincodeCache.has(trimmed)) return pincodeCache.get(trimmed)!;
  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/open/postcode/details?postcode=${encodeURIComponent(trimmed)}`,
      { signal }
    );
    if (res.ok) {
      const data = await res.json();
      const result = parseShiprocketData(data);
      if (result) {
        pincodeCache.set(trimmed, result);
        return result;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }
  try {
    const rawData = await getPostcodeDetailsAction(trimmed);
    if (rawData) {
      const result = parseShiprocketData(rawData);
      if (result) {
        pincodeCache.set(trimmed, result);
        return result;
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(trimmed)}`, {
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.[0]) {
        const poList = data[0].PostOffice as Array<{
          Name?: string;
          District?: string;
          Block?: string;
          State?: string;
        }>;
        const po = poList[0];
        const locList = poList.map((p) => p.Name).filter((n): n is string => Boolean(n));
        const district = po.District || po.Block;
        const result = formatLocation(locList, district, po.State);
        if (result.display) {
          pincodeCache.set(trimmed, result);
          return result;
        }
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }
  return null;
}
