import { NavType } from '../../types/types';
import { parseAnyDate, parseNavDate } from '../../utilities/utility';
import { getBatchMutualFundNavAction } from '@/actions/data';
import {
  CLIENT_NAV_CACHE_TTL_MS,
  getSessionItem,
  recordApiUsage,
  setSessionItem,
} from './clientStorage';
import {
  MFMetaType,
  fetchMFbySchemeCode,
  mfDetailsCache,
  mfNavCache,
} from './mfApi';
/**
 * High-performance batch fetcher for multiple pinned mutual funds.
 * Resolves all funds in a single server action call instead of multiple parallel requests.
 */
export const fetchBatchMFbySchemeCodes = async (
  schemeCodes: (string | number)[],
  requestedEndDate?: string | null
): Promise<Record<string, NavType[]>> => {
  const result: Record<string, NavType[]> = {};
  if (!Array.isArray(schemeCodes) || schemeCodes.length === 0) return result;
  const missingCodes: string[] = [];
  for (const rawCode of schemeCodes) {
    const code = String(rawCode).trim();
    if (!code || code === '0') continue;
    const cached = mfNavCache.get(code);
    const sessionCached = getSessionItem<NavType[]>('mf_nav_' + code);
    let existingData: NavType[] | null = null;
    if (cached && cached.expiresAt > Date.now()) {
      existingData = cached.data;
    } else if (sessionCached && Array.isArray(sessionCached) && sessionCached.length > 0) {
      existingData = sessionCached;
    }
    if (existingData) {
      let cacheSatisfies = true;
      if (requestedEndDate) {
        let latestDateMs = 0;
        for (const n of existingData) {
          const time = parseNavDate(n.date).getTime();
          if (time > latestDateMs) latestDateMs = time;
        }
        const reqDateMs = parseAnyDate(requestedEndDate).getTime();
        if (reqDateMs > latestDateMs) {
          cacheSatisfies = false;
        }
      }
      if (cacheSatisfies) {
        if (!cached) {
          mfNavCache.set(code, {
            expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
            data: existingData,
          });
        }
        result[code] = existingData;
        continue;
      }
    }
    missingCodes.push(code);
  }
  if (missingCodes.length === 0) {
    return result;
  }
  recordApiUsage();
  try {
    const batchData = await getBatchMutualFundNavAction(missingCodes, requestedEndDate);
    for (const [code, rawPayload] of Object.entries(batchData)) {
      let parsed = rawPayload;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // Keep raw object if not JSON string
        }
      }
      const data = parsed as { data?: NavType[]; meta?: MFMetaType };
      if (data && Array.isArray(data.data)) {
        result[code] = data.data;
        mfNavCache.set(code, {
          expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
          data: data.data,
        });
        setSessionItem('mf_nav_' + code, data.data);
        if (data.meta) {
          mfDetailsCache.set(code, {
            expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
            data: { data: data.data, meta: data.meta },
          });
        }
      }
    }
    const stillUnresolved = missingCodes.filter((c) => !result[c] || result[c].length === 0);
    if (stillUnresolved.length > 0) {
      await Promise.all(
        stillUnresolved.map(async (code) => {
          try {
            const navData = await fetchMFbySchemeCode(code);
            if (Array.isArray(navData) && navData.length > 0) {
              result[code] = navData;
            }
          } catch {
            // Ignore individual fetch failure
          }
        })
      );
    }
  } catch (err) {
    console.warn('Batch mutual fund NAV fetch failed, falling back to individual:', err);
    await Promise.all(
      missingCodes.map(async (code) => {
        try {
          const navData = await fetchMFbySchemeCode(code);
          result[code] = navData;
        } catch {
          // Ignore individual fetch failure in batch fallback
        }
      })
    );
  }
  return result;
};
