import {
  getPPFRateForYear,
  MAX_PPF_ANNUAL_DEPOSIT,
  DEFAULT_PPF_TENURE_YEARS,
  PPF_EXTENSION_BLOCK_YEARS,
} from '../data/ppfRates';
export type PPFFrequency = 'monthly' | 'yearly';
export type PPFDepositTiming = 'before_5th' | 'after_5th';
export type PPFExtensionMode = 'with_contribution' | 'without_contribution';
export interface PPFMonthDetail {
  monthIndex: number; // 0 for April, 11 for March
  monthName: string;  // e.g. "April", "May", ...
  deposit: number;
  eligibleBalanceForInterest: number;
  monthlyInterest: number;
  closingBalance: number;
}
export interface PPFYearDetail {
  yearNumber: number;        // 1, 2, ... 15, 16 ...
  startYear: number;         // e.g. 2024
  fyLabel: string;           // e.g. "2024-25"
  isHistorical: boolean;
  interestRate: number;      // e.g. 7.1
  isExtensionYear: boolean;
  openingBalance: number;
  annualDeposit: number;
  totalInterest: number;
  closingBalance: number;
  months: PPFMonthDetail[];
}
export interface PPFCalculationInput {
  depositAmount: number;             // Amount per installment (monthly or yearly)
  frequency: PPFFrequency;          // 'monthly' | 'yearly'
  depositTiming: PPFDepositTiming;  // 'before_5th' | 'after_5th'
  startYear: number;                // e.g. 2024 for FY 2024-25
  extensionBlocks: number;          // 0, 1, 2, 3, 4 (each block = 5 years)
  extensionMode: PPFExtensionMode;  // 'with_contribution' | 'without_contribution'
  projectedRate?: number;           // For future years (default 7.1%)
  depositMonthIndex?: number;       // For yearly frequency: 0 for April (default), 11 for March
}
export interface PPFCalculationResult {
  totalInvested: number;
  totalInterest: number;
  maturityAmount: number;
  tenureYears: number;
  maturityYear: number;
  maturityFyLabel: string;
  yearlyBreakdown: PPFYearDetail[];
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
  } = input;
  const totalYears = DEFAULT_PPF_TENURE_YEARS + extensionBlocks * PPF_EXTENSION_BLOCK_YEARS;
  const yearlyBreakdown: PPFYearDetail[] = [];
  let runningBalance = 0;
  let totalInvested = 0;
  let totalInterestAccumulated = 0;
  for (let y = 0; y < totalYears; y++) {
    const currentFYStart = startYear + y;
    const isExtensionYear = y >= DEFAULT_PPF_TENURE_YEARS;
    const allowsContribution = !isExtensionYear || extensionMode === 'with_contribution';
    const rateInfo = getPPFRateForYear(currentFYStart, projectedRate);
    const annualRate = rateInfo.rate;
    const monthlyRate = annualRate / 100 / 12;
    const openingBalance = runningBalance;
    let annualDeposit = 0;
    let yearInterestSum = 0;
    const monthsDetail: PPFMonthDetail[] = [];
    // Calculate month by month (April to March)
    for (let m = 0; m < 12; m++) {
      let monthDeposit = 0;
      if (allowsContribution) {
        if (frequency === 'monthly') {
          monthDeposit = depositAmount;
        } else if (frequency === 'yearly' && m === depositMonthIndex) {
          monthDeposit = depositAmount;
        }
      }
      // Enforce max annual cap of 1.5 Lakh
      if (annualDeposit + monthDeposit > MAX_PPF_ANNUAL_DEPOSIT) {
        monthDeposit = Math.max(0, MAX_PPF_ANNUAL_DEPOSIT - annualDeposit);
      }
      annualDeposit += monthDeposit;
      // RBI / Post Office Rule:
      // Interest is calculated on the lowest balance between the 5th day and the end of the month.
      // If deposit is made on or before 5th, it is included in this month's interest calculation.
      // If deposit is made after 5th, it is NOT included in this month's interest calculation.
      const eligibleBalance =
        depositTiming === 'before_5th' ? runningBalance + monthDeposit : runningBalance;
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
    }
    // Official Post Office / Banking Rule:
    // Interest is credited & compounded annually on March 31st (rounded to nearest rupee)
    const roundedYearInterest = Math.round(yearInterestSum);
    runningBalance += roundedYearInterest;
    totalInvested += annualDeposit;
    totalInterestAccumulated += roundedYearInterest;
    yearlyBreakdown.push({
      yearNumber: y + 1,
      startYear: currentFYStart,
      fyLabel: rateInfo.fyLabel,
      isHistorical: rateInfo.isHistorical,
      interestRate: annualRate,
      isExtensionYear,
      openingBalance: Math.round(openingBalance),
      annualDeposit: Math.round(annualDeposit),
      totalInterest: roundedYearInterest,
      closingBalance: Math.round(runningBalance),
      months: monthsDetail,
    });
  }
  const maturityFYStart = startYear + totalYears;
  const maturityNextShort = String((maturityFYStart + 1) % 100).padStart(2, '0');
  return {
    totalInvested: Math.round(totalInvested),
    totalInterest: Math.round(totalInterestAccumulated),
    maturityAmount: Math.round(runningBalance),
    tenureYears: totalYears,
    maturityYear: startYear + totalYears,
    maturityFyLabel: `${maturityFYStart}-${maturityNextShort}`,
    yearlyBreakdown,
  };
}
