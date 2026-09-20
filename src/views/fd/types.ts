export const TAX_SLABS = [0, 5, 10, 15, 20, 30] as const;
export interface FdTaxAnalysis {
  maxSec80TTB: number;
  taxableInterest: number;
  estimatedTax: number;
  postTaxInterest: number;
  postTaxMaturity: number;
  postTaxCagr: string;
  annualInterest: number;
  tdsThreshold: number;
  isTdsApplicable: boolean;
  numPayouts: number;
  periodicTax: number;
  postTaxPeriodicPayout: number;
}
export interface FdCalculations {
  payoutAmount: number;
  tenureMonths: number;
  tenureYears: number;
  principalDeposit: number;
  totalInterestEarned: number;
  principalPercent: number;
  taxAnalysis: FdTaxAnalysis;
  selectedPayoutTitle: string;
}
