import { useEffect, useRef } from 'react';
import { resolveDateRange } from '../../utilities/dateGuards';
import type { SipSavedState, StoredPinnedFund } from './types';
const STORAGE_KEY = 'mutual_fund_sip_state';
export const getDefaultSipState = (): SipSavedState => ({
  searchKey: 'Kotak Arbitrage Fund',
  selectedType: 'Direct',
  selectedGrowth: 'Growth',
  selectedCode: '0',
  duration: '740',
  monthlyAmount: '100000',
  showDate: false,
  viewChart: true,
  pinnedFunds: [],
  startDate: null,
  endDate: null,
  dayOfMonth: '3',
  investmentStepUp: '0',
});
export const loadSavedSipState = (): SipSavedState => {
  if (typeof window === 'undefined') return getDefaultSipState();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return getDefaultSipState();
    const parsed = JSON.parse(saved);
    const defaultState = getDefaultSipState();
    const pinnedFunds = Array.isArray(parsed.pinnedFunds)
      ? parsed.pinnedFunds
          .filter((fund: { schemeCode?: string }) => Boolean(fund?.schemeCode))
          .map((fund: { schemeCode: string; schemeName?: string }) => ({
            schemeCode: String(fund.schemeCode),
            schemeName: fund.schemeName ?? '',
          }))
      : [];
    let duration = typeof parsed.duration === 'string' && parsed.duration ? parsed.duration : defaultState.duration;
    if (parseInt(duration, 10) < 20) duration = '740';
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
      duration,
      pinnedFunds: Array.from(new Map(pinnedFunds.map((f: StoredPinnedFund) => [f.schemeCode, f])).values()).slice(0, 8),
      startDate: validStartDate,
      endDate: validEndDate,
    };
  } catch (err) {
    console.warn('Failed to restore mutual fund state:', err);
    return getDefaultSipState();
  }
};
export function useSipStorage(
  currentState: SipSavedState,
  onRestore: (saved: SipSavedState) => void
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
        const saved = loadSavedSipState();
        onRestoreRef.current(saved);
      } catch (err) {
        console.warn('Failed to restore SIP state:', err);
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
      console.warn('Failed to persist SIP state:', err);
    }
  }, [currentState]);
}
