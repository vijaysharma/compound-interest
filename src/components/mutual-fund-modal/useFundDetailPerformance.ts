import { useMemo } from 'react';
import type { NavType } from '../../types/types';
import { getNearest } from '../../utilities/utility';
import type {
  DetailedFundItem,
  InvestmentType,
  TaxMode,
  PerformanceMetrics,
  TaxCalculations,
} from './types';
import { parseDateParts } from './utils';
import { calculateFundTax } from './taxUtils';
import { calculateLumpsumPerformance, calculateSipPerformance } from './performanceUtils';
const EMPTY_PERFORMANCE: PerformanceMetrics = {
  invested: 0,
  maturity: 0,
  gain: 0,
  absReturn: 0,
  cagr: 0,
  startNavVal: 0,
  endNavVal: 0,
  datasets: [],
};
export function useFundDetailPerformance(
  fund: DetailedFundItem | null,
  navData: NavType[],
  investmentType: InvestmentType,
  investmentValue: string,
  startDateISO: string,
  endDateISO: string,
  currentNavStartDate: string,
  currentNavEndDate: string,
  minNavDateISO: string,
  maxNavDateISO: string,
  holdingDays: number,
  holdingYears: number,
  isLongTerm: boolean,
  taxMode: TaxMode,
  fundCategory: string
): { performance: PerformanceMetrics; taxCalculations: TaxCalculations } {
  const performance = useMemo<PerformanceMetrics>(() => {
    if (!navData || navData.length === 0) {
      return {
        ...EMPTY_PERFORMANCE,
        invested: fund?.invAmt || 0,
        maturity: fund?.matureAmt || 0,
        gain: fund?.profitAmt || 0,
        absReturn: fund?.absProfit || 0,
        cagr: fund?.profit || 0,
      };
    }
    const sNavObj = getNearest(currentNavStartDate, navData);
    const eNavObj = getNearest(currentNavEndDate, navData);
    const sNav = sNavObj ? parseFloat(sNavObj.nav) : 10;
    const eNav = eNavObj ? parseFloat(eNavObj.nav) : sNav;
    const amountInput = Math.max(100, parseFloat(investmentValue) || 100000);
    const lowerT = Math.min(parseDateParts(currentNavStartDate), parseDateParts(currentNavEndDate));
    const upperT = Math.max(parseDateParts(currentNavStartDate), parseDateParts(currentNavEndDate));
    if (investmentType === 'lumpsum') {
      return calculateLumpsumPerformance(
        fund,
        navData,
        amountInput,
        sNav,
        eNav,
        holdingYears,
        lowerT,
        upperT
      );
    }
    return calculateSipPerformance(
      fund,
      navData,
      amountInput,
      sNav,
      eNav,
      holdingYears,
      startDateISO,
      endDateISO,
      minNavDateISO,
      maxNavDateISO,
      lowerT,
      upperT,
      getNearest
    );
  }, [
    fund,
    navData,
    currentNavStartDate,
    currentNavEndDate,
    investmentType,
    investmentValue,
    holdingYears,
    startDateISO,
    minNavDateISO,
    endDateISO,
    maxNavDateISO,
  ]);
  const taxCalculations = useMemo<TaxCalculations>(
    () =>
      calculateFundTax(
        performance,
        taxMode,
        fundCategory,
        isLongTerm,
        holdingDays,
        holdingYears
      ),
    [performance, taxMode, fundCategory, isLongTerm, holdingDays, holdingYears]
  );
  return { performance, taxCalculations };
}
