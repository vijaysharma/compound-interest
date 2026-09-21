import { executeTransactions } from './executor';
import { buildSnapshots } from './timeline';
import { buildTotals } from './totals';
import type { NavBook, StrategyConfig, StrategyResult } from './types';
/**
 * The single source of truth for this calculator.
 *
 *   plan transactions -> execute against actual NAVs -> units
 *     -> historical valuation -> timeline -> chart + statistics
 *
 * There is no assumed return anywhere in this pipeline. Every rupee becomes
 * units at the NAV published on (or most recently before) its transaction
 * date, and every value is those units priced at an actual NAV.
 */
export const runStrategy = (config: StrategyConfig, navBook: NavBook): StrategyResult => {
  const state = executeTransactions(config, navBook);
  return {
    transactions: state.transactions,
    snapshots: buildSnapshots(config, navBook, state.transactions),
    column2Units: state.column2Units,
    totals: buildTotals(config, navBook, state),
    warnings: state.warnings,
  };
};
export const EMPTY_RESULT: StrategyResult = {
  transactions: [],
  snapshots: [],
  column2Units: {},
  totals: {
    initialInvestment: 0,
    column1Units: 0,
    column1Value: 0,
    column2Value: 0,
    totalValue: 0,
    personalFromColumn1: 0,
    personalFromColumn2: 0,
    totalPersonalWithdrawals: 0,
    lastPersonalWithdrawal: null,
    withdrawnFromColumn1: 0,
    routedToColumn2: 0,
    investedInColumn2: 0,
    unallocatedColumn2Cash: 0,
    routedToColumn3: 0,
    reinvestedIntoColumn1: 0,
    column3CashBalance: 0,
    asOfDate: '',
    asOfNavDate: '',
  },
  warnings: [],
};
