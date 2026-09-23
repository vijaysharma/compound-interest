import { NavType } from '../../types/types';
import { getBatchMutualFundNavAction } from '@/actions/data';
import { getTodayISO } from '../../utilities/dateGuards';
import { isNavHistoryFresh, navFreshnessCeiling } from '../../utilities/navCalendar';
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
 * Whether a cached history answers a request for `requestedEndDate`.
 *
 * This replaces a `Set` of `${schemeCode}|${endDate}` pairs that recorded
 * "already tried this date once". That existed to stop the network being hit
 * repeatedly for a date upstream will never publish — a weekend, a holiday, or
 * today before the evening — which was the right problem to notice but the
 * wrong layer to fix it at: the set never expired, so after one attempt the
 * cache was considered satisfactory for that date forever and a genuinely newer
 * NAV was never picked up for the rest of the session.
 *
 * Asking against the publication ceiling removes the need for the workaround
 * altogether: a history ending Friday *is* fresh for a Saturday request, so
 * there is no failed attempt to remember. The server applies the same ceiling,
 * and the re-sync cooldown there handles the holiday case.
 */
const historySatisfies = (data: NavType[] | undefined, requestedEndDate?: string | null): boolean => {
  if (!data || data.length === 0) return false;
  return isNavHistoryFresh(data, navFreshnessCeiling(requestedEndDate || getTodayISO()));
};
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
    const existingData =
      cached && cached.expiresAt > Date.now() ? cached.data : sessionCached ?? null;
    if (existingData && historySatisfies(existingData, requestedEndDate)) {
      if (!cached) {
        mfNavCache.set(code, {
          expiresAt: Date.now() + CLIENT_NAV_CACHE_TTL_MS,
          data: existingData,
        });
      }
      result[code] = existingData;
      continue;
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
            const navData = await fetchMFbySchemeCode(code, requestedEndDate);
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
          const navData = await fetchMFbySchemeCode(code, requestedEndDate);
          result[code] = navData;
        } catch {
          // Ignore individual fetch failure in batch fallback
        }
      })
    );
  }
  return result;
};
