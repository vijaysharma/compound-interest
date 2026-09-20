export type PPFFrequency = 'monthly' | 'yearly';
export type PPFDepositTiming = 'before_5th' | 'after_5th';
export type PPFExtensionMode = 'with_contribution' | 'without_contribution';
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
  interestRate: number; // e.g. 7.1
  isExtensionYear: boolean;
  openingBalance: number;
  annualDeposit: number;
  totalInterest: number;
  closingBalance: number;
  months: PPFMonthDetail[];
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
