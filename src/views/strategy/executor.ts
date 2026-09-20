import { resolveNav } from './navLookup';
import { planTransactions } from './transactions';
import { addMoney, isZeroMoney, roundMoney, unitsFor } from './money';
import type {
  ExecutedTransaction,
  NavBook,
  PlannedTransaction,
  StrategyConfig,
} from './types';
export interface ExecutionState {
  transactions: ExecutedTransaction[];
  column1Units: number;
  /** Units per Column 2 config entry, so two entries on one fund stay separate. */
  column2Units: Record<string, number>;
  /** Money routed out of Column 1 that no SIP has taken up yet. */
  column2Cash: number;
  /** Money routed out of Column 2 SWPs awaiting a Column 3 reinvestment. */
  column3Cash: number;
  warnings: string[];
}
const emptyState = (): ExecutionState => ({
  transactions: [],
  column1Units: 0,
  column2Units: {},
  column2Cash: 0,
  column3Cash: 0,
  warnings: [],
});
const warn = (state: ExecutionState, message: string): void => {
  if (!state.warnings.includes(message)) state.warnings.push(message);
};
/** Sell up to `amount` worth of units, never more than the holding allows. */
const sell = (
  heldUnits: number,
  amount: number,
  nav: number
): { units: number; settled: number; clamped: boolean } => {
  const wanted = unitsFor(amount, nav);
  if (wanted <= heldUnits) return { units: wanted, settled: roundMoney(wanted * nav), clamped: false };
  return { units: heldUnits, settled: roundMoney(heldUnits * nav), clamped: true };
};
/**
 * Replays the plan against actual NAVs, one transaction at a time, in date
 * order. Every buy and sell converts rupees to units at the NAV applicable to
 * that transaction date; nothing grows by an assumed rate.
 */
export const executeTransactions = (
  config: StrategyConfig,
  navBook: NavBook
): ExecutionState => {
  const state = emptyState();
  const plan = planTransactions(config);
  const fundName = (code: string): string =>
    config.column2.find((entry) => entry.fund.schemeCode === code)?.fund.schemeName ??
    config.column1.fund?.schemeName ??
    code;
  const record = (row: PlannedTransaction, nav: { date: string; nav: number }, units: number, settled: number) => {
    state.transactions.push({ ...row, navDate: nav.date, nav: nav.nav, units, settledAmount: settled });
  };
  for (const row of plan) {
    const nav = resolveNav(navBook[row.schemeCode] ?? [], row.date);
    if (!nav) {
      warn(state, `No NAV published for ${fundName(row.schemeCode)} on or before ${row.date}.`);
      continue;
    }
    if (row.kind === 'c1-invest') {
      const units = unitsFor(row.amount, nav.nav);
      state.column1Units += units;
      record(row, nav, units, row.amount);
      continue;
    }
    if (row.kind === 'c1-withdraw') {
      const result = sell(state.column1Units, row.amount, nav.nav);
      if (isZeroMoney(result.settled)) {
        warn(state, `Column 1 had no units left to withdraw on ${row.date}.`);
        continue;
      }
      if (result.clamped) {
        warn(state, `Column 1 could only fund a partial withdrawal on ${row.date}.`);
      }
      const share = row.amount > 0 ? result.settled / row.amount : 0;
      const routed = roundMoney(row.routedOnward * share);
      state.column1Units -= result.units;
      state.column2Cash = addMoney(state.column2Cash, routed);
      record({ ...row, routedOnward: routed }, nav, -result.units, result.settled);
      continue;
    }
    if (row.kind === 'c2-sip') {
      const spend = Math.min(row.amount, state.column2Cash);
      if (isZeroMoney(spend) || spend < 0) continue;
      const units = unitsFor(spend, nav.nav);
      const key = row.configId ?? row.schemeCode;
      state.column2Units[key] = (state.column2Units[key] ?? 0) + units;
      state.column2Cash = addMoney(state.column2Cash, -spend);
      record(row, nav, units, roundMoney(spend));
      continue;
    }
    if (row.kind === 'c2-swp') {
      const key = row.configId ?? row.schemeCode;
      const result = sell(state.column2Units[key] ?? 0, row.amount, nav.nav);
      if (isZeroMoney(result.settled)) {
        warn(state, `${fundName(row.schemeCode)} had no units left to withdraw on ${row.date}.`);
        continue;
      }
      if (result.clamped) {
        warn(state, `${fundName(row.schemeCode)} could only fund a partial SWP on ${row.date}.`);
      }
      const share = row.amount > 0 ? result.settled / row.amount : 0;
      const routed = roundMoney(row.routedOnward * share);
      state.column2Units[key] = (state.column2Units[key] ?? 0) - result.units;
      state.column3Cash = addMoney(state.column3Cash, routed);
      record({ ...row, routedOnward: routed }, nav, -result.units, result.settled);
      continue;
    }
    const invest = row.amount > 0 ? Math.min(row.amount, state.column3Cash) : state.column3Cash;
    if (isZeroMoney(invest) || invest < 0) continue;
    const units = unitsFor(invest, nav.nav);
    state.column1Units += units;
    state.column3Cash = addMoney(state.column3Cash, -invest);
    record(row, nav, units, roundMoney(invest));
  }
  return state;
};
