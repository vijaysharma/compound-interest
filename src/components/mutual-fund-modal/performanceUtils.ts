import type { NavType } from '../../types/types';
import { getChartSeriesColor } from '@/data/chartColors';
import type { DetailedFundItem, PerformanceMetrics } from './types';
import { parseDateParts } from './utils';
export function calculateLumpsumPerformance(
  fund: DetailedFundItem | null,
  navData: NavType[],
  amountInput: number,
  sNav: number,
  eNav: number,
  holdingYears: number,
  lowerT: number,
  upperT: number
): PerformanceMetrics {
  const units = amountInput / sNav;
  const maturity = units * eNav;
  const gain = maturity - amountInput;
  const absReturn = (gain / amountInput) * 100;
  const cagr =
    amountInput > 0 && maturity > 0
      ? (Math.pow(maturity / amountInput, 1 / holdingYears) - 1) * 100
      : 0;
  const points = navData
    .map((p) => ({
      date: p.date,
      nav: Number((units * parseFloat(p.nav)).toFixed(2)),
      time: parseDateParts(p.date),
    }))
    .filter((p) => p.time >= lowerT && p.time <= upperT)
    .sort((a, b) => a.time - b.time)
    .map(({ date, nav }) => ({ date, nav }));
  return {
    invested: amountInput,
    maturity,
    gain,
    absReturn,
    cagr,
    startNavVal: sNav,
    endNavVal: eNav,
    datasets: [
      {
        label: `${fund?.schemeName || 'Fund'} (Lumpsum)`,
        color: fund?.color || getChartSeriesColor(0),
        data: points,
      },
    ],
  };
}
export function calculateSipPerformance(
  fund: DetailedFundItem | null,
  navData: NavType[],
  amountInput: number,
  sNav: number,
  eNav: number,
  holdingYears: number,
  startDateISO: string,
  endDateISO: string,
  minNavDateISO: string,
  maxNavDateISO: string,
  lowerT: number,
  upperT: number,
  getNearest: (date: string, nav: NavType[]) => NavType | undefined | null
): PerformanceMetrics {
  const monthlySip = amountInput;
  const sDate = new Date(startDateISO || minNavDateISO || '2020-01-01');
  const eDate = new Date(endDateISO || maxNavDateISO || '2024-01-01');
  const dayOfMonth = sDate.getDate();
  let totalUnits = 0;
  let installments = 0;
  const cur = new Date(sDate);
  while (cur <= eDate) {
    const year = cur.getFullYear();
    const month = String(cur.getMonth() + 1).padStart(2, '0');
    const day = String(Math.min(dayOfMonth, 28)).padStart(2, '0');
    const navItem = getNearest(`${day}-${month}-${year}`, navData);
    const navVal = navItem ? parseFloat(navItem.nav) : 10;
    if (navVal > 0) {
      totalUnits += monthlySip / navVal;
      installments++;
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  const totalInvested = Math.max(monthlySip, installments * monthlySip);
  const maturity = totalUnits * eNav;
  const gain = maturity - totalInvested;
  const absReturn = (gain / totalInvested) * 100;
  const avgDurationYears = Math.max(0.1, holdingYears / 2);
  const cagr =
    totalInvested > 0 && maturity > 0
      ? (Math.pow(maturity / totalInvested, 1 / avgDurationYears) - 1) * 100
      : 0;
  const points = navData
    .map((p) => ({
      date: p.date,
      nav: Number((totalUnits * parseFloat(p.nav)).toFixed(2)),
      time: parseDateParts(p.date),
    }))
    .filter((p) => p.time >= lowerT && p.time <= upperT)
    .sort((a, b) => a.time - b.time)
    .map(({ date, nav }) => ({ date, nav }));
  return {
    invested: totalInvested,
    maturity,
    gain,
    absReturn,
    cagr,
    startNavVal: sNav,
    endNavVal: eNav,
    datasets: [
      {
        label: `${fund?.schemeName || 'Fund'} (SIP)`,
        color: fund?.color || getChartSeriesColor(0),
        data: points,
      },
    ],
  };
}
