import {
  getPPFRateForYear,
  MAX_PPF_ANNUAL_DEPOSIT,
  DEFAULT_PPF_TENURE_YEARS,
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

  // Determine tenure:
  const baseTenure = DEFAULT_PPF_TENURE_YEARS + extensionBlocks * PPF_EXTENSION_BLOCK_YEARS;
  // If history spans more years than baseTenure, extend tenure to cover all historical years
  const historySpanYears = hasHistory ? latestHistoryFy - effectiveStartYear + 1 : 0;
  const totalYears = Math.max(baseTenure, historySpanYears);

  const asOfInfo = getFyAndMonth(asOfDate);
  const yearlyBreakdown: PPFYearDetail[] = [];
  let runningBalance = 0;
  let totalInvested = 0;
  let totalInterestAccumulated = 0;

  let currentBalance = 0;
  let investedToDate = 0;
  let interestEarnedToDate = 0;

  // Compute invested to date from history
  if (hasHistory) {
    for (const entry of validHistory) {
      if (entry.investmentDate <= asOfDate) {
        investedToDate += Number(entry.amount);
      }
    }
  }

  for (let y = 0; y < totalYears; y++) {
    const currentFYStart = effectiveStartYear + y;
    const isExtensionYear = y >= DEFAULT_PPF_TENURE_YEARS;
    const allowsContribution = !isExtensionYear || extensionMode === 'with_contribution';
    const rateInfo = getPPFRateForYear(currentFYStart, projectedRate);
    const annualRate = rateInfo.rate;
    const monthlyRate = annualRate / 100 / 12;
    const openingBalance = runningBalance;
    let annualDeposit = 0;
    let yearInterestSum = 0;
    const monthsDetail: PPFMonthDetail[] = [];

    // Is this year in the actual historical investment span?
    const hasHistoryInYear = historyFyMap.has(currentFYStart);
    const isPastOrCurrentHistoricalYear = hasHistory && currentFYStart <= latestHistoryFy;

    // Calculate month by month (April to March)
    for (let m = 0; m < 12; m++) {
      let monthDeposit = 0;
      let earlyDepositForInterest = 0;

      if (hasHistoryInYear) {
        const monthMap = historyFyMap.get(currentFYStart);
        const mData = monthMap?.get(m);
        if (mData) {
          monthDeposit = mData.earlyDeposits + mData.lateDeposits;
          earlyDepositForInterest = mData.earlyDeposits;
        }
      } else if (isPastOrCurrentHistoricalYear) {
        // Gap year in historical records — 0 deposit made
        monthDeposit = 0;
        earlyDepositForInterest = 0;
      } else {
        // Future projection year
        if (allowsContribution && futureContributionMode === 'continue') {
          if (frequency === 'monthly') {
            monthDeposit = depositAmount;
            if (depositTiming === 'before_5th') {
              earlyDepositForInterest = depositAmount;
            }
          } else if (frequency === 'yearly' && m === depositMonthIndex) {
            monthDeposit = depositAmount;
            if (depositTiming === 'before_5th') {
              earlyDepositForInterest = depositAmount;
            }
          }
        }
      }

      // Enforce PPF annual maximum cap of ₹1.5 Lakh for interest calculation
      // If deposits in the FY exceed 1.5L, interest is only calculated up to 1.5L
      const eligibleDepositForInterest = Math.min(
        earlyDepositForInterest,
        Math.max(0, MAX_PPF_ANNUAL_DEPOSIT - annualDeposit)
      );

      annualDeposit += monthDeposit;

      // RBI / Post Office Rule:
      // Interest is calculated on the lowest balance between the 5th day and the end of the month.
      // Deposits made on or before the 5th earn interest in that month.
      // Deposits made after the 5th do not earn interest for that month, but increase closing balance.
      const eligibleBalance = runningBalance + eligibleDepositForInterest;
      const monthlyInterest = eligibleBalance * monthlyRate;
      yearInterestSum += monthlyInterest;

      // Update running balance with the deposit
      runningBalance += monthDeposit;

      monthsDetail.push({
        monthIndex: m,
        monthName: FY_MONTH_NAMES[m],
        deposit: monthDeposit,
        eligibleBalanceForInterest: Math.round(eligibleBalance),
        monthlyInterest: Math.round(monthlyInterest),
        closingBalance: Math.round(runningBalance),
      });

      // If we are currently at asOfDate's month and FY
      if (hasHistory && currentFYStart === asOfInfo.fyStartYear && m === asOfInfo.monthIndex) {
        // Current balance includes opening balance of current FY + actual deposits made up to date
        currentBalance = Math.round(runningBalance);
      }
    }

    // Official Post Office / Banking Rule:
    // Interest is credited & compounded annually on March 31st (rounded to nearest rupee)
    const roundedYearInterest = Math.round(yearInterestSum);
    runningBalance += roundedYearInterest;
    totalInvested += annualDeposit;
    totalInterestAccumulated += roundedYearInterest;

    // Track interest credited on completed March 31sts prior to or on asOfDate
    if (hasHistory) {
      const fyEndYear = currentFYStart + 1;
      const asOfEndBoundary = `${fyEndYear}-03-31`;
      if (asOfDate >= asOfEndBoundary) {
        interestEarnedToDate += roundedYearInterest;
      }
      // If asOfDate is in a future year beyond latest history, ensure currentBalance tracks
      if (currentFYStart < asOfInfo.fyStartYear) {
        currentBalance = Math.round(runningBalance);
      }
    }

    yearlyBreakdown.push({
      yearNumber: y + 1,
      startYear: currentFYStart,
      fyLabel: rateInfo.fyLabel,
      isHistorical: rateInfo.isHistorical || isPastOrCurrentHistoricalYear,
      interestRate: annualRate,
      isExtensionYear,
      openingBalance: Math.round(openingBalance),
      annualDeposit: Math.round(annualDeposit),
      totalInterest: roundedYearInterest,
      closingBalance: Math.round(runningBalance),
      months: monthsDetail,
      isActualHistory: isPastOrCurrentHistoricalYear && hasHistoryInYear,
    });
  }

  // If currentBalance was not captured (e.g., asOfDate is before opening FY or after all years)
  if (!hasHistory) {
    currentBalance = 0;
    investedToDate = 0;
    interestEarnedToDate = 0;
  } else if (currentBalance === 0) {
    // If asOfDate is beyond the latest historical year
    currentBalance = Math.round(investedToDate + interestEarnedToDate);
  }

  const maturityFYStart = effectiveStartYear + totalYears;
  const maturityNextShort = String((maturityFYStart + 1) % 100).padStart(2, '0');

  return {
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(totalInterestAccumulated),
    maturityAmount: Math.round(runningBalance),
    tenureYears: totalYears,
    maturityYear: effectiveStartYear + totalYears,
    maturityFyLabel: `${maturityFYStart}-${maturityNextShort}`,
    yearlyBreakdown,
    hasHistory,
    currentBalance: Math.round(currentBalance),
    investedToDate: Math.round(investedToDate),
    interestEarnedToDate: Math.round(interestEarnedToDate),
    historyEntryCount: validHistory.length,
    openingFyStart: effectiveStartYear,
  };
}
