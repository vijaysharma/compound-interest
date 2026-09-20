import { resolveNav } from './navLookup';
import { addMoney, roundMoney, valueFor } from './money';
import type { ExecutionState } from './executor';
import type { NavBook, StrategyConfig, StrategyTotals } from './types';
const sumSettled = (
  state: ExecutionState,
  predicate: (kind: string) => boolean,
  pick: 'settledAmount' | 'routedOnward'
): number =>
  state.transactions
    .filter((transaction) => predicate(transaction.kind))
    .reduce((total, transaction) => addMoney(total, transaction[pick]), 0);
/**
 * Final statistics, all of them read off the executed transactions and the
 * closing unit balances valued at the NAV applicable to the as-of date.
 */
export const buildTotals = (
  config: StrategyConfig,
  navBook: NavBook,
  state: ExecutionState
): StrategyTotals => {
  const schemeCode = config.column1.fund?.schemeCode ?? '';
  const column1Nav = resolveNav(navBook[schemeCode] ?? [], config.asOfDate);
  const column1Value = column1Nav ? valueFor(state.column1Units, column1Nav.nav) : 0;
  let column2Value = 0;
  for (const entry of config.column2) {
    const units = state.column2Units[entry.id] ?? 0;
    if (units <= 0) continue;
    const nav = resolveNav(navBook[entry.fund.schemeCode] ?? [], config.asOfDate);
    if (nav) column2Value = addMoney(column2Value, valueFor(units, nav.nav));
  }
  const withdrawnFromColumn1 = sumSettled(state, (kind) => kind === 'c1-withdraw', 'settledAmount');
  const routedToColumn2 = sumSettled(state, (kind) => kind === 'c1-withdraw', 'routedOnward');
  const investedInColumn2 = sumSettled(state, (kind) => kind === 'c2-sip', 'settledAmount');
  const withdrawnFromColumn2 = sumSettled(state, (kind) => kind === 'c2-swp', 'settledAmount');
  const routedToColumn3 = sumSettled(state, (kind) => kind === 'c2-swp', 'routedOnward');
  const reinvestedIntoColumn1 = sumSettled(state, (kind) => kind === 'c3-reinvest', 'settledAmount');
  const personalFromColumn1 = roundMoney(withdrawnFromColumn1 - routedToColumn2);
  const personalFromColumn2 = roundMoney(withdrawnFromColumn2 - routedToColumn3);
  return {
    initialInvestment: roundMoney(config.column1.amount),
    column1Units: state.column1Units,
    column1Value,
    column2Value,
    totalValue: addMoney(column1Value, column2Value),
    personalFromColumn1,
    personalFromColumn2,
    totalPersonalWithdrawals: addMoney(personalFromColumn1, personalFromColumn2),
    withdrawnFromColumn1,
    routedToColumn2,
    investedInColumn2,
    unallocatedColumn2Cash: roundMoney(state.column2Cash),
    routedToColumn3,
    reinvestedIntoColumn1,
    column3CashBalance: roundMoney(state.column3Cash),
    asOfDate: config.asOfDate,
    asOfNavDate: column1Nav?.date ?? '',
  };
};
