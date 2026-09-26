import type { NavType } from '../../types/types';
export type Frequency = 'monthly' | 'quarterly' | 'yearly';
/** A NAV row resolved to ISO (YYYY-MM-DD) with a numeric NAV. */
export interface NavPoint {
  date: string;
  nav: number;
}
/** Raw AMFI NAV history keyed by scheme code, as returned by the MF API. */
export type NavBook = Record<string, NavType[]>;
export interface FundRef {
  schemeCode: string;
  schemeName: string;
  color: string;
}
/** One Column 1 withdrawal window. Personal use = amount - toColumn2. */
export interface WithdrawalPeriod {
  id: string;
  startDate: string;
  endDate: string;
  frequency: Frequency;
  amount: number;
  toColumn2: number;
  /**
   * Yearly increase applied to `amount`, as a percentage. The Column 2 share
   * escalates by the same factor, so the personal/Column 2 split stays in the
   * proportion the user set.
   */
  annualStepUpPct: number;
}
export interface Column1Config {
  fund: FundRef | null;
  amount: number;
  investmentDate: string;
  withdrawals: WithdrawalPeriod[];
}
/** Column 2 SWP. Personal use = amount - toColumn3. */
export interface SwpRule {
  enabled: boolean;
  startDate: string;
  endDate: string;
  amount: number;
  frequency: Frequency;
  toColumn3: number;
  annualStepUpPct?: number;
}
export type CascadeInterval = '1 Month' | '1 Quarter' | '6 Months' | '1 Year';
export interface BulkSwpConfig {
  swpAmount: number;
  reinvestmentAmount: number;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  cascadeInterval: CascadeInterval;
}
export interface Column2FundConfig {
  id: string;
  fund: FundRef;
  allocationPct: number;
  sipStartDate: string;
  swp: SwpRule;
}
/** Column 3 sweeps its cash pool back into the Column 1 fund. */
export interface Column3Config {
  frequency: Frequency;
  startDate: string;
  mode: 'sweep' | 'fixed';
  amount: number;
}
export interface StrategyConfig {
  column1: Column1Config;
  column2: Column2FundConfig[];
  column3: Column3Config;
  asOfDate: string;
}
export type TransactionKind = 'c1-invest' | 'c1-withdraw' | 'c2-sip' | 'c2-swp' | 'c3-reinvest';
export interface PlannedTransaction {
  kind: TransactionKind;
  /** Requested calendar date (ISO). The applicable NAV date may differ. */
  date: string;
  bucket: 'column1' | 'column2';
  schemeCode: string;
  /** Column 2 fund config id, for SIP/SWP rows. */
  configId?: string;
  /** Requested rupee amount. Zero for a Column 3 sweep-everything row. */
  amount: number;
  /** Portion of `amount` routed onward (C1 -> C2, or C2 -> C3). */
  routedOnward: number;
}
export interface ExecutedTransaction extends PlannedTransaction {
  /** NAV date actually applied (nearest published NAV on or before `date`). */
  navDate: string;
  nav: number;
  /** Positive when units were bought, negative when sold. */
  units: number;
  /** Rupees actually moved, which can be less than `amount` when clamped. */
  settledAmount: number;
}
export interface PortfolioSnapshot {
  date: string;
  column1Value: number;
  column2Value: number;
  totalValue: number;
}
/**
 * The most recent instalment that actually paid money out to the user, after
 * the share routed onward to the next stage. Null until one has been paid.
 */
export interface PersonalWithdrawal {
  /** Scheduled instalment date. */
  date: string;
  /** NAV date the units were actually sold at. */
  navDate: string;
  /** Rupees kept, i.e. settled amount less the share routed onward. */
  amount: number;
  source: 'core' | 'growth';
  /** Scheme the units were sold from. */
  fundName: string;
}
export interface StrategyTotals {
  initialInvestment: number;
  column1Units: number;
  column1Value: number;
  column2Value: number;
  totalValue: number;
  personalFromColumn1: number;
  personalFromColumn2: number;
  totalPersonalWithdrawals: number;
  /** The latest personal-use payout, for the "last drawn" readout. */
  lastPersonalWithdrawal: PersonalWithdrawal | null;
  withdrawnFromColumn1: number;
  routedToColumn2: number;
  investedInColumn2: number;
  unallocatedColumn2Cash: number;
  routedToColumn3: number;
  reinvestedIntoColumn1: number;
  column3CashBalance: number;
  asOfDate: string;
  asOfNavDate: string;
}
export interface StrategyResult {
  transactions: ExecutedTransaction[];
  snapshots: PortfolioSnapshot[];
  column2Units: Record<string, number>;
  totals: StrategyTotals;
  warnings: string[];
}
