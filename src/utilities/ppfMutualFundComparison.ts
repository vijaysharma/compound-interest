import { getNearest } from './navUtils';
import { parseNavDate, parseAnyDate, navDateToISO } from './dateUtils';
import { calculateXirr } from './mutual-fund/xirrCalculation';
import type { NavType } from '../types/types';
import type { PPFCalculationResult, PpfInvestmentRecord } from './ppfCalculations';

export interface MfInvestmentOutcome {
  id: string;
  date: string;
  amount: number;
  nav: number;
  navDate: string;
  units: number;
  currentValue: number;
  absoluteGain: number;
  gainPercent: number;
  isBeforeInception: boolean;
}

export interface MfComparisonResult {
  schemeCode: string;
  schemeName: string;
  totalInvested: number;
  totalUnits: number;
  latestNav: number;
  latestNavDate: string;
  earliestNavDate: string;
  mfCurrentValue: number;
  mfTotalGain: number;
  mfGainPercent: number;
  xirr?: number;
  ppfCurrentValue: number;
  ppfTotalGain: number;
  ppfGainPercent: number;
  diffAmount: number; // mfCurrentValue - ppfCurrentValue
  diffPercent: number; // ((mfCurrentValue - ppfCurrentValue) / ppfCurrentValue) * 100
  wealthMultiplier: number; // mfCurrentValue / ppfCurrentValue
  outcomes: MfInvestmentOutcome[];
  hasInceptionWarning: boolean;
}

/**
 * Calculates real investment outcomes if the exact same historical PPF deposits
 * were invested into a chosen mutual fund on those exact dates.
 */
export function calculateMfComparison(
  investments: PpfInvestmentRecord[],
  navData: NavType[],
  ppfResult: PPFCalculationResult,
  schemeCode = '',
  schemeName = 'Mutual Fund'
): MfComparisonResult | null {
  if (!navData || navData.length === 0 || investments.length === 0) {
    return null;
  }

  // Parse and sort NAV data chronologically ascending
  const validNavs = navData
    .map((row) => ({
      raw: row,
      nav: Number(row.nav),
      time: parseNavDate(row.date).getTime(),
      iso: navDateToISO(row.date),
    }))
    .filter((row) => Number.isFinite(row.nav) && row.nav > 0 && Number.isFinite(row.time))
    .sort((a, b) => a.time - b.time);

  if (validNavs.length === 0) {
    return null;
  }

  const earliestRow = validNavs[0];
  const latestRow = validNavs[validNavs.length - 1];
  const earliestTime = earliestRow.time;
  const latestNav = latestRow.nav;
  const latestNavDate = latestRow.iso;
  const earliestNavDate = earliestRow.iso;

  let totalInvested = 0;
  let totalUnits = 0;
  let hasInceptionWarning = false;

  const outcomes: MfInvestmentOutcome[] = [];

  for (const inv of investments) {
    const invAmount = Number(inv.amount) || 0;
    if (invAmount <= 0) continue;

    totalInvested += invAmount;
    const invTime = parseAnyDate(inv.investmentDate).getTime();
    const isBefore = Number.isFinite(invTime) && invTime < earliestTime;
    if (isBefore) {
      hasInceptionWarning = true;
    }

    const nearest = getNearest(inv.investmentDate, navData);
    const applicableNav = nearest && Number(nearest.nav) > 0 ? Number(nearest.nav) : earliestRow.nav;
    const applicableNavDate = nearest ? navDateToISO(nearest.date) : earliestNavDate;

    const units = applicableNav > 0 ? invAmount / applicableNav : 0;
    totalUnits += units;

    const currentValue = units * latestNav;
    const absoluteGain = currentValue - invAmount;
    const gainPercent = invAmount > 0 ? (absoluteGain / invAmount) * 100 : 0;

    outcomes.push({
      id: inv.id,
      date: inv.investmentDate,
      amount: invAmount,
      nav: applicableNav,
      navDate: applicableNavDate,
      units,
      currentValue,
      absoluteGain,
      gainPercent,
      isBeforeInception: isBefore,
    });
  }

  const mfCurrentValue = totalUnits * latestNav;
  const mfTotalGain = mfCurrentValue - totalInvested;
  const mfGainPercent = totalInvested > 0 ? (mfTotalGain / totalInvested) * 100 : 0;

  // Build cashflows for XIRR: investments as negative outflows, current portfolio valuation as inflow
  const cashFlows = investments
    .filter((inv) => Number(inv.amount) > 0)
    .map((inv) => ({
      date: inv.investmentDate,
      amount: -Number(inv.amount),
    }));

  if (latestNavDate && mfCurrentValue > 0) {
    cashFlows.push({
      date: latestNavDate,
      amount: mfCurrentValue,
    });
  }

  const xirr = cashFlows.length >= 2 ? calculateXirr(cashFlows) : undefined;

  const ppfCurrentValue = ppfResult.currentBalance;
  const ppfTotalGain = ppfResult.interestEarnedToDate;
  const ppfGainPercent =
    ppfResult.investedToDate > 0 ? (ppfTotalGain / ppfResult.investedToDate) * 100 : 0;

  const diffAmount = mfCurrentValue - ppfCurrentValue;
  const diffPercent =
    ppfCurrentValue > 0 ? ((mfCurrentValue - ppfCurrentValue) / ppfCurrentValue) * 100 : 0;
  const wealthMultiplier = ppfCurrentValue > 0 ? mfCurrentValue / ppfCurrentValue : 0;

  return {
    schemeCode,
    schemeName,
    totalInvested,
    totalUnits,
    latestNav,
    latestNavDate,
    earliestNavDate,
    mfCurrentValue,
    mfTotalGain,
    mfGainPercent,
    xirr,
    ppfCurrentValue,
    ppfTotalGain,
    ppfGainPercent,
    diffAmount,
    diffPercent,
    wealthMultiplier,
    outcomes,
    hasInceptionWarning,
  };
}
