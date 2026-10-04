import {
  getPPFRateForYear,
  getPPFRateForMonth,
  MAX_PPF_ANNUAL_DEPOSIT,
  DEFAULT_PPF_TENURE_YEARS,
  PPF_DEPOSIT_FY_COUNT,
  PPF_EXTENSION_BLOCK_YEARS,
} from '../data/ppfRates';
export type * from './ppfTypes';
import type {
  PPFCalculationInput,
  PPFCalculationResult,
  PPFMonthDetail,
  PPFYearDetail,
  PpfInvestmentRecord,
} from './ppfTypes';
const fyLabelFor = (startYear: number) => `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
/**
 * PPF maturity rule: the opening FY is not counted; the account matures on 31 March at the end of
 * the 15th complete FY after it (plus 5 FYs per extension block). Deposits are allowed in every FY
 * from the opening FY up to and including the maturity FY — 16 FYs for the base term.
 */
export function getPPFMaturity(openingFyStart: number, extensionBlocks = 0) {
  const maturityFyStart = openingFyStart + DEFAULT_PPF_TENURE_YEARS + extensionBlocks * PPF_EXTENSION_BLOCK_YEARS;
  return {
    maturityFyStart,
    maturityFyLabel: fyLabelFor(maturityFyStart),
    maturityDate: `${maturityFyStart + 1}-03-31`,
    depositFyCount: maturityFyStart - openingFyStart + 1,
  };
}
const FY_MONTH_NAMES = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];
export interface FyMonthInfo {
  fyStartYear: number;
  monthIndex: number; // 0 for April, 11 for March
  day: number;
  isValid: boolean;
}
/**
 * Maps a YYYY-MM-DD date to Indian Financial Year (starts April 1) and month index (April=0..March=11)
 */
export function getFyAndMonth(dateStr?: string | null): FyMonthInfo {
  if (!dateStr || typeof dateStr !== 'string') {
    return { fyStartYear: 0, monthIndex: 0, day: 0, isValid: false };
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match) {
    return { fyStartYear: 0, monthIndex: 0, day: 0, isValid: false };
  }
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { fyStartYear: 0, monthIndex: 0, day: 0, isValid: false };
  }
  if (month >= 4) {
    return {
      fyStartYear: year,
      monthIndex: month - 4, // April = 0, Dec = 8
      day,
      isValid: true,
    };
  } else {
    return {
      fyStartYear: year - 1,
      monthIndex: month + 8, // Jan = 9, Feb = 10, Mar = 11
      day,
      isValid: true,
    };
  }
}
interface MonthDeposits {
  earlyDeposits: number; // deposited on or before 5th of month (earns interest this month)
  lateDeposits: number;  // deposited after 5th of month (earns interest next month)
  entries: PpfInvestmentRecord[];
}
export function calculatePPF(input: PPFCalculationInput): PPFCalculationResult {
  const {
    depositAmount,
    frequency,
    depositTiming,
    startYear,
    extensionBlocks,
    extensionMode,
    projectedRate = 7.1,
    depositMonthIndex = 0, // April by default for yearly lump sum
    history = [],
    asOfDate = new Date().toISOString().slice(0, 10),
    futureContributionMode = 'continue',
  } = input;
  // 1. Sanitize & validate historical records
  const validHistory = history
    .filter((entry): entry is PpfInvestmentRecord => {
      if (!entry || typeof entry !== 'object') return false;
      const amt = Number(entry.amount);
      if (!Number.isFinite(amt) || amt <= 0) return false;
      const fyInfo = getFyAndMonth(entry.investmentDate);
      return fyInfo.isValid;
    })
    .sort((a, b) => a.investmentDate.localeCompare(b.investmentDate));
  const hasHistory = validHistory.length > 0;
  // 2. Build financial year lookup map for history
  const historyFyMap = new Map<number, Map<number, MonthDeposits>>();
  let earliestHistoryFy = startYear;
  let latestHistoryFy = startYear;
  if (hasHistory) {
    earliestHistoryFy = getFyAndMonth(validHistory[0].investmentDate).fyStartYear;
    latestHistoryFy = earliestHistoryFy;
    for (const record of validHistory) {
      const fyInfo = getFyAndMonth(record.investmentDate);
      const fy = fyInfo.fyStartYear;
      if (fy < earliestHistoryFy) earliestHistoryFy = fy;
      if (fy > latestHistoryFy) latestHistoryFy = fy;
      if (!historyFyMap.has(fy)) {
        historyFyMap.set(fy, new Map());
      }
      const monthMap = historyFyMap.get(fy)!;
      if (!monthMap.has(fyInfo.monthIndex)) {
        monthMap.set(fyInfo.monthIndex, { earlyDeposits: 0, lateDeposits: 0, entries: [] });
      }
      const mData = monthMap.get(fyInfo.monthIndex)!;
      const amt = Number(record.amount);
      if (fyInfo.day <= 5) {
        mData.earlyDeposits += amt;
      } else {
        mData.lateDeposits += amt;
      }
      mData.entries.push(record);
    }
  }
  // Determine starting financial year:
  // If user provided history, account began in the earliest investment FY.
  const effectiveStartYear = hasHistory ? Math.min(startYear, earliestHistoryFy) : startYear;
  // Tenure: opening FY + 15 counted FYs (+5 per extension block). Recorded deposits beyond that
  // span (an account continued past maturity) stretch the schedule to cover them.
  const baseScheduleYears = PPF_DEPOSIT_FY_COUNT + extensionBlocks * PPF_EXTENSION_BLOCK_YEARS;
  const historySpanYears = hasHistory ? latestHistoryFy - effectiveStartYear + 1 : 0;
  const totalYears = Math.max(baseScheduleYears, historySpanYears);
  const asOfInfo = getFyAndMonth(asOfDate);
  const asOfFy = asOfInfo.isValid ? asOfInfo.fyStartYear : Number.POSITIVE_INFINITY;
  const asOfMonth = asOfInfo.isValid ? asOfInfo.monthIndex : 11;
  const yearlyBreakdown: PPFYearDetail[] = [];
  let runningBalance = 0;
  let totalInvested = 0;
  let totalInterestAccumulated = 0;
  let totalExcessDeposit = 0;
  let currentBalance = 0;
  let investedToDate = 0;
  let interestEarnedToDate = 0;
  const plannedEarly = depositTiming === 'before_5th';
  for (let y = 0; y < totalYears; y++) {
    const currentFYStart = effectiveStartYear + y;
    // Years after the 16 deposit FYs of the base term are extension years.
    const isExtensionYear = y >= PPF_DEPOSIT_FY_COUNT;
    const allowsContribution = !isExtensionYear || extensionMode === 'with_contribution';
    const rateInfo = getPPFRateForYear(currentFYStart, projectedRate);
    const openingBalance = runningBalance;
    let annualDeposit = 0;
    let excessDeposit = 0;
    let yearInterestSum = 0;
    const monthsDetail: PPFMonthDetail[] = [];
    const monthRates: number[] = [];
    const hasHistoryInYear = historyFyMap.has(currentFYStart);
    const monthMap = historyFyMap.get(currentFYStart);
    // With real records, every FY before the as-of FY is settled history: a year with no record
    // means nothing was deposited, it is not filled in with the planned amount. Recorded FYs after
    // the as-of FY (deposits entered ahead of time) are honoured as-is too.
    const isSettledYear =
      hasHistory && (currentFYStart < asOfFy || (currentFYStart > asOfFy && currentFYStart <= latestHistoryFy));
    const isCurrentYear = hasHistory && currentFYStart === asOfFy;
    const projectsDeposits = allowsContribution && futureContributionMode === 'continue';
    let recordedThisYear = 0;
    if (monthMap) {
      for (const md of monthMap.values()) recordedThisYear += md.earlyDeposits + md.lateDeposits;
    }
    // In the as-of FY, a yearly plan with nothing recorded yet is expected in the planned month,
    // or next month if that month has already passed.
    const currentYearLumpMonth = Math.max(depositMonthIndex, asOfMonth + 1);
    for (let m = 0; m < 12; m++) {
      let early = 0;
      let late = 0;
      const mData = monthMap?.get(m);
      if (mData) {
        early += mData.earlyDeposits;
        late += mData.lateDeposits;
      }
      const planned =
        frequency === 'monthly' ? depositAmount : m === depositMonthIndex ? depositAmount : 0;
      if (!hasHistory) {
        if (projectsDeposits && planned > 0) {
          if (plannedEarly) early += planned;
          else late += planned;
        }
      } else if (isCurrentYear && projectsDeposits && m > asOfMonth) {
        const plannedNow =
          frequency === 'monthly'
            ? depositAmount
            : recordedThisYear === 0 && m === currentYearLumpMonth
              ? depositAmount
              : 0;
        if (plannedNow > 0) {
          if (plannedEarly) early += plannedNow;
          else late += plannedNow;
        }
      } else if (!isSettledYear && !isCurrentYear && projectsDeposits && planned > 0) {
        if (plannedEarly) early += planned;
        else late += planned;
      }
      // Annual cap: anything above ₹1.5 lakh in an FY is not accepted into the account — it earns
      // no interest and is refundable — so it never enters the balance.
      const room = Math.max(0, MAX_PPF_ANNUAL_DEPOSIT - annualDeposit);
      const acceptedEarly = Math.min(early, room);
      const acceptedLate = Math.min(late, room - acceptedEarly);
      const accepted = acceptedEarly + acceptedLate;
      excessDeposit += early + late - accepted;
      annualDeposit += accepted;
      // Interest accrues on the lowest balance between the 5th and month end: deposits on or
      // before the 5th count this month, later ones from next month.
      const monthRate = getPPFRateForMonth(currentFYStart, m, projectedRate);
      monthRates.push(monthRate);
      const eligibleBalance = runningBalance + acceptedEarly;
      const monthlyInterest = (eligibleBalance * monthRate) / 100 / 12;
      yearInterestSum += monthlyInterest;
      runningBalance += accepted;
      const onOrBeforeAsOf = currentFYStart < asOfFy || (currentFYStart === asOfFy && m <= asOfMonth);
      if (hasHistory && onOrBeforeAsOf) investedToDate += accepted;
      monthsDetail.push({
        monthIndex: m,
        monthName: FY_MONTH_NAMES[m],
        deposit: accepted,
        eligibleBalanceForInterest: Math.round(eligibleBalance),
        monthlyInterest: Math.round(monthlyInterest),
        closingBalance: Math.round(runningBalance),
      });
      if (hasHistory && currentFYStart === asOfFy && m === asOfMonth) {
        currentBalance = Math.round(runningBalance);
      }
    }
    // Interest is credited and compounded once a year, on 31 March (rounded to the rupee).
    const roundedYearInterest = Math.round(yearInterestSum);
    runningBalance += roundedYearInterest;
    totalInvested += annualDeposit;
    totalExcessDeposit += excessDeposit;
    totalInterestAccumulated += roundedYearInterest;
    if (hasHistory) {
      if (asOfDate >= `${currentFYStart + 1}-03-31`) interestEarnedToDate += roundedYearInterest;
      if (currentFYStart < asOfFy) currentBalance = Math.round(runningBalance);
    }
    const distinctRates = [...new Set(monthRates)];
    const effectiveRate = Math.round((monthRates.reduce((a, b) => a + b, 0) / 12) * 100) / 100;
    yearlyBreakdown.push({
      yearNumber: y + 1,
      startYear: currentFYStart,
      fyLabel: rateInfo.fyLabel,
      isHistorical: rateInfo.isHistorical || isSettledYear,
      interestRate: distinctRates.length === 1 ? distinctRates[0] : effectiveRate,
      rateLabel: distinctRates.length === 1 ? undefined : monthRates.filter((r, i) => i % 3 === 0).join(' / '),
      isExtensionYear,
      isMaturityYear: y === totalYears - 1,
      openingBalance: Math.round(openingBalance),
      annualDeposit: Math.round(annualDeposit),
      excessDeposit: Math.round(excessDeposit),
      totalInterest: roundedYearInterest,
      closingBalance: Math.round(runningBalance),
      months: monthsDetail,
      isActualHistory: hasHistory && hasHistoryInYear && (isSettledYear || isCurrentYear),
    });
  }
  if (!hasHistory) {
    currentBalance = 0;
    investedToDate = 0;
    interestEarnedToDate = 0;
  }
  const maturityFYStart = effectiveStartYear + totalYears - 1;
  const maturity = getPPFMaturity(effectiveStartYear, 0);
  return {
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(totalInterestAccumulated),
    maturityAmount: Math.round(runningBalance),
    tenureYears: totalYears - 1,
    depositYears: totalYears,
    maturityYear: maturityFYStart + 1,
    maturityFyLabel: fyLabelFor(maturityFYStart),
    maturityDate: `${maturityFYStart + 1}-03-31`,
    baseMaturityDate: maturity.maturityDate,
    excessDeposit: Math.round(totalExcessDeposit),
    yearlyBreakdown,
    hasHistory,
    currentBalance: Math.round(currentBalance),
    investedToDate: Math.round(investedToDate),
    interestEarnedToDate: Math.round(interestEarnedToDate),
    historyEntryCount: validHistory.length,
    openingFyStart: effectiveStartYear,
  };
}
