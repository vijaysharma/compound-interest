import { useEffect, useRef } from 'react';
import { resolveDateRange } from '../../utilities/dateGuards';
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
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);
  useEffect(() => {
    if (isLoadedRef.current) return;
    const id = requestAnimationFrame(() => {
      try {
        const saved = loadSavedSwpState();
        onRestoreRef.current(saved);
      } catch (err) {
        console.warn('Failed to restore SWP state:', err);
      } finally {
        isLoadedRef.current = true;
      }
    });
    return () => cancelAnimationFrame(id);
    // Restore must run exactly once; the callback is read through a ref so an
    // unstable `onRestore` identity cannot re-trigger it (infinite render loop).
  }, []);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (err) {
      console.warn('Failed to persist SWP state:', err);
    }
  }, [currentState]);
}
