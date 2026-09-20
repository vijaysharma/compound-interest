import { useMemo } from 'react';
import type { NavType } from '../../types/types';
import type { PinnedFund } from '../../components/mutual-fund/types';
import type { SipFundAnalysis } from './types';
import { getNearest } from '../../utilities/utility';
import { calculateSip, calculateSipGrowth } from '../../utilities/mutualFundCalculations';
const getNavDateTime = (date: string): number => {
  const [day, month, year] = date.split('-').map(Number);
  return Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)
    ? new Date(year, month - 1, day).getTime()
    : Number.NaN;
};
const getLatestNav = (data: NavType[]): NavType | undefined => {
  return data.reduce<NavType | undefined>((latest, nav) => {
    const navTime = getNavDateTime(nav.date);
    return Number.isFinite(Number(nav.nav)) &&
      Number.isFinite(navTime) &&
      (!latest || navTime > getNavDateTime(latest.date))
      ? nav
      : latest;
  }, undefined);
};
export function useSipAnalysis(
  pinnedFunds: PinnedFund[],
  pinnedNavData: Record<string, NavType[]>,
  startDate: string | null,
  endDate: string | null,
  monthlyAmount: string,
  investmentStepUp: string,
  dayOfMonth: string,
  viewChart: boolean
) {
  const fundAnalyses = useMemo<SipFundAnalysis[]>(() => {
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      const emptyItem: SipFundAnalysis = {
        schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color,
        startNav: undefined, endNav: undefined, profit: 0, absProfit: 0, matureAmt: 0,
        profitAmt: 0, invested: 0, units: 0, averageNav: 0, installments: 0, xirr: undefined,
      };
      if (navData.length === 0) return emptyItem;
      const start = startDate ? getNearest(startDate, navData) : undefined;
      const end = endDate ? getNearest(endDate, navData) : undefined;
      if (!start || !end) return { ...emptyItem, startNav: start, endNav: end };
      const startValue = parseFloat(start.nav);
      if (!Number.isFinite(startValue) || startValue <= 0) return { ...emptyItem, startNav: start, endNav: end };
      try {
        const simulation = calculateSip(
          navData, startDate ?? '', endDate ?? '',
          Number(monthlyAmount), Number(investmentStepUp), Number(dayOfMonth)
        );
        const matureAmount = simulation.currentValue;
        const latestNav = getLatestNav(navData);
        const latestValue = latestNav ? Number((simulation.units * Number(latestNav.nav)).toFixed(2)) : undefined;
        const absProfit = ((latestValue ?? simulation.currentValue) / simulation.invested - 1) * 100;
        const profitAmount = Math.round((latestValue ?? simulation.currentValue) - simulation.invested);
        return {
          schemeCode: fund.schemeCode, schemeName: fund.schemeName, color: fund.color,
          startNav: start, endNav: end, profit: simulation.xirr ? simulation.xirr * 100 : 0,
          absProfit, matureAmt: Number(matureAmount.toFixed(2)), latestValue,
          latestNavDate: latestNav?.date, latestXirr: simulation.latestXirr,
          profitAmt: Number(profitAmount.toFixed(2)), invested: simulation.invested,
          units: simulation.units, averageNav: simulation.invested / simulation.units,
          installments: simulation.installments, xirr: simulation.xirr,
        };
      } catch {
        return { ...emptyItem, startNav: start, endNav: end };
      }
    });
  }, [pinnedFunds, pinnedNavData, startDate, endDate, monthlyAmount, investmentStepUp, dayOfMonth]);
  const chartDatasets = useMemo(() => {
    if (!viewChart) return [];
    return pinnedFunds.map((fund) => {
      const navData = pinnedNavData[fund.schemeCode] ?? [];
      if (navData.length === 0 || !startDate || !endDate) return { label: fund.schemeName, color: fund.color, data: [] };
      try {
        const chartData = calculateSipGrowth(
          navData, startDate, endDate,
          Number(monthlyAmount), Number(investmentStepUp), Number(dayOfMonth)
        );
        return { label: fund.schemeName, color: fund.color, data: chartData };
      } catch {
        return { label: fund.schemeName, color: fund.color, data: [] };
      }
    });
  }, [viewChart, pinnedFunds, pinnedNavData, startDate, endDate, monthlyAmount, investmentStepUp, dayOfMonth]);
  return { fundAnalyses, chartDatasets };
}
