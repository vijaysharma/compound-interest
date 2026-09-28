import { useEffect, useRef } from 'react';
import { resolveDateRange } from '../../utilities/dateGuards';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
import type { SwpSavedState } from './types';
import type { StoredPinnedFund } from '../sip/types';
const STORAGE_KEY = 'mutual_fund_swp_state';
export const getDateMinusYears = (years: number): string => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().split('T')[0];
};
export const getTodayDate = (): string => new Date().toISOString().split('T')[0];
export const getDefaultSwpState = (): SwpSavedState => ({
  searchKey: 'Kotak Arbitrage Fund',
  selectedType: 'Direct',
  selectedGrowth: 'Growth',
  selectedCode: '0',
  monthlyWithdrawalAmount: '100000',
  lumpSumInvestmentAmount: '30000000',
  viewChart: true,
  pinnedFunds: [],
  startSwpDate: null,
  endSwpDate: null,
  lumpsumStartDate: null,
  dayOfMonth: '3',
  investmentStepUp: '0',
});
export const loadSavedSwpState = (): SwpSavedState => {
  if (typeof window === 'undefined') return getDefaultSwpState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return getDefaultSwpState();
    const parsed = JSON.parse(saved);
    const defaultState = getDefaultSwpState();
    const pinnedFunds = Array.isArray(parsed.pinnedFunds)
      ? parsed.pinnedFunds
          .filter((fund: { schemeCode?: string }) => Boolean(fund?.schemeCode))
          .map((fund: { schemeCode: string; schemeName?: string }) => ({
            schemeCode: String(fund.schemeCode),
            schemeName: fund.schemeName ?? '',
          }))
      : [];
    let validStartDate = typeof parsed.startSwpDate === 'string' ? parsed.startSwpDate : null;
    let validEndDate = typeof parsed.endSwpDate === 'string' ? parsed.endSwpDate : null;
    if (validStartDate && validEndDate) {
      const resolved = resolveDateRange(validStartDate, validEndDate);
      validStartDate = resolved.startDate;
      validEndDate = resolved.endDate;
    }
    return {
      ...defaultState,
      ...parsed,
      pinnedFunds: Array.from(new Map(pinnedFunds.map((f: StoredPinnedFund) => [f.schemeCode, f])).values()).slice(0, 8),
      startSwpDate: validStartDate,
      endSwpDate: validEndDate,
    };
  } catch (err) {
    console.warn('Failed to restore mutual fund state:', err);
    return getDefaultSwpState();
  }
};
export function useSwpStorage(
  currentState: SwpSavedState,
  onRestore: (saved: SwpSavedState) => void
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
      let saved = loadSavedSwpState();
      try {
        const token = getAuthToken();
        const guestId = getOrCreateGuestId();
        const serverRes = await getUserAppStateAction<SwpSavedState>(
          token,
          guestId,
          'mutual_funds',
          'swp'
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
      console.warn('Failed to persist SWP state:', err);
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const token = getAuthToken();
      const guestId = getOrCreateGuestId();
      void saveUserAppStateAction(token, guestId, 'mutual_funds', 'swp', currentState);
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [currentState]);
}
