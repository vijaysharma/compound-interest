export const TAX_SLABS = [0, 5, 10, 15, 20, 30] as const;
export interface RdTaxAnalysis {
  maxSec80TTB: number;
  taxableInterest: number;
  estimatedTax: number;
  postTaxInterest: number;
  postTaxMaturity: number;
  postTaxCagr: string;
  annualInterest: number;
  tdsThreshold: number;
  isTdsApplicable: boolean;
}
export interface RdCalculations {
  payoutAmount: number;
  totalDeposited: number;
  totalInterestEarned: number;
  depositPercent: number;
  tenureYears: number;
  taxAnalysis: RdTaxAnalysis;
}
