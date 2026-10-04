export type PPFFrequency = 'monthly' | 'yearly';
export type PPFDepositTiming = 'before_5th' | 'after_5th';
export type PPFExtensionMode = 'with_contribution' | 'without_contribution';
export type PPFFutureMode = 'continue' | 'stop';
export interface PpfInvestmentRecord {
  id: string;
  investmentDate: string; // YYYY-MM-DD
  amount: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface PPFMonthDetail {
  monthIndex: number; // 0 for April, 11 for March
  monthName: string; // e.g. "April", "May", ...
  deposit: number;
  eligibleBalanceForInterest: number;
  monthlyInterest: number;
  closingBalance: number;
}
export interface PPFYearDetail {
  yearNumber: number; // 1, 2, ... 15, 16 ...
  startYear: number; // e.g. 2024
  fyLabel: string; // e.g. "2024-25"
  isHistorical: boolean;
  interestRate: number; // e.g. 7.1 (12-month average when the rate changed mid-year)
  rateLabel?: string; // quarterly rates when they changed mid-year, e.g. "7.6 / 7.6 / 8 / 8"
  isExtensionYear: boolean;
  isMaturityYear?: boolean; // the FY whose 31 March closes the account (or current extension)
  openingBalance: number;
  annualDeposit: number; // accepted deposits (capped at ₹1.5 lakh per FY)
  excessDeposit?: number; // deposited above the annual cap: not accepted, earns no interest
  totalInterest: number;
  closingBalance: number;
  months: PPFMonthDetail[];
  isActualHistory?: boolean;
}
export interface PPFCalculationInput {
  depositAmount: number; // Amount per installment (monthly or yearly)
  frequency: PPFFrequency; // 'monthly' | 'yearly'
  depositTiming: PPFDepositTiming; // 'before_5th' | 'after_5th'
  startYear: number; // e.g. 2024 for FY 2024-25
  extensionBlocks: number; // 0, 1, 2, 3, 4 (each block = 5 years)
  extensionMode: PPFExtensionMode; // 'with_contribution' | 'without_contribution'
  projectedRate?: number; // For future years (default 7.1%)
  depositMonthIndex?: number; // For yearly frequency: 0 for April (default), 11 for March
  history?: PpfInvestmentRecord[]; // Real investment entries
  asOfDate?: string; // Reference date for current balance (defaults to today)
  futureContributionMode?: PPFFutureMode; // continue with depositAmount or stop contributions
}
export interface PPFCalculationResult {
  totalInvested: number;
  totalInterest: number;
  maturityAmount: number;
  tenureYears: number; // complete FYs after the opening FY (15 for the base term)
  depositYears: number; // FYs in which deposits are allowed, opening FY included (16 for the base term)
  maturityYear: number; // calendar year of the maturity date
  maturityFyLabel: string; // last FY counted, e.g. "2029-30"
  maturityDate: string; // YYYY-MM-DD, always 31 March, e.g. "2030-03-31"
  baseMaturityDate: string; // maturity of the original 15-year term, before extensions
  excessDeposit: number; // total deposited above the annual cap across all FYs
  yearlyBreakdown: PPFYearDetail[];
  hasHistory: boolean;
  currentBalance: number;
  investedToDate: number;
  interestEarnedToDate: number;
  historyEntryCount: number;
  openingFyStart: number;
}
