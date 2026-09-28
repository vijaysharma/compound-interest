import { useEffect, useRef } from 'react';
import type { LumpsumSavedState, PinnedFund } from '../../components/mutual-fund/types';
import { resolveDateRange } from '../../utilities/dateGuards';
import { getChartSeriesColor } from '../../data/chartColors';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
const STORAGE_KEY = 'mutual_fund_lumpsum_state';
export const getDefaultLumpsumState = (): LumpsumSavedState => ({
  searchKey: 'Kotak Arbitrage Fund',
  selectedType: 'Direct',
  selectedGrowth: 'Growth',
  selectedCode: '0',
  duration: '1',
  invAmt: '100000',
  showDate: true,
  viewChart: true,
  pinnedFunds: [],
  startDate: null,
  endDate: null,
});
export const loadSavedLumpsumState = (): LumpsumSavedState => {
  if (typeof window === 'undefined') return getDefaultLumpsumState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return getDefaultLumpsumState();
    const parsed = JSON.parse(saved);
    const defaultState = getDefaultLumpsumState();
    const pinnedFunds = Array.isArray(parsed.pinnedFunds)
      ? parsed.pinnedFunds.filter((fund: PinnedFund) => Boolean(fund?.schemeCode))
      : [];
    let validStartDate = typeof parsed.startDate === 'string' ? parsed.startDate : null;
    let validEndDate = typeof parsed.endDate === 'string' ? parsed.endDate : null;
    if (validStartDate && validEndDate) {
      const resolved = resolveDateRange(validStartDate, validEndDate);
      validStartDate = resolved.startDate;
      validEndDate = resolved.endDate;
    }
    return {
      ...defaultState,
      ...parsed,
      showDate: parsed.showDate !== undefined ? Boolean(parsed.showDate) : true,
      viewChart: parsed.viewChart !== undefined ? Boolean(parsed.viewChart) : true,
      pinnedFunds: Array.from(new Map(pinnedFunds.map((f: PinnedFund) => [f.schemeCode, f])).values()).slice(0, 8),
      startDate: validStartDate,
      endDate: validEndDate,
    };
  } catch (err) {
    console.warn('Failed to restore mutual fund state:', err);
    return getDefaultLumpsumState();
  }
};
export function useLumpsumStorage(
  currentState: LumpsumSavedState,
  onRestore: (saved: LumpsumSavedState) => void
) {
  const isLoadedRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);
  useEffect(() => {
    if (isLoadedRef.current) return;
    const handleRestore = async () => {
      let saved = loadSavedLumpsumState();
      try {
        const token = getAuthToken();
        const guestId = getOrCreateGuestId();
        const serverRes = await getUserAppStateAction<LumpsumSavedState>(
          token,
          guestId,
          'mutual_funds',
          'lumpsum'
        );
        if (serverRes.success && serverRes.payload) {
          saved = {
            ...saved,
            ...serverRes.payload,
          };
        }
      } catch {
        // Fall back to local saved state
      }
      if (saved.pinnedFunds && saved.pinnedFunds.length > 0) {
        saved.pinnedFunds = saved.pinnedFunds.map((fund, index) => ({
          ...fund,
          color: getChartSeriesColor(index),
        }));
      }
      onRestoreRef.current(saved);
      isLoadedRef.current = true;
    };
    const id = requestAnimationFrame(() => {
      void handleRestore();
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (err) {
      console.warn('Failed to persist mutual fund state:', err);
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const token = getAuthToken();
      const guestId = getOrCreateGuestId();
      void saveUserAppStateAction(token, guestId, 'mutual_funds', 'lumpsum', currentState);
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentState]);
}
