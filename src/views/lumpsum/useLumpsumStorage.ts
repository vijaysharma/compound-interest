import { useEffect, useRef } from 'react';
import type { LumpsumSavedState, PinnedFund } from '../../components/mutual-fund/types';
import { resolveDateRange } from '../../utilities/dateGuards';
import { getChartSeriesColor } from '../../data/chartColors';
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
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);
  useEffect(() => {
    if (isLoadedRef.current) return;
    const handleRestore = () => {
      const saved = loadSavedLumpsumState();
      if (saved.pinnedFunds && saved.pinnedFunds.length > 0) {
        saved.pinnedFunds = saved.pinnedFunds.map((fund, index) => ({
          ...fund,
          color: getChartSeriesColor(index),
        }));
      }
      onRestoreRef.current(saved);
      isLoadedRef.current = true;
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
    // Restore must run exactly once; the callback is read through a ref so an
    // unstable `onRestore` identity cannot re-trigger it (infinite render loop).
  }, []);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (err) {
      console.warn('Failed to persist mutual fund state:', err);
    }
  }, [currentState]);
}
