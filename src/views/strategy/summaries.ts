import { resolveNav } from './navLookup';
import { addMoney, roundMoney, valueFor } from './money';
import type {
  Column2FundConfig,
  NavBook,
  StrategyConfig,
  StrategyResult,
} from './types';
export interface Column2FundSummary {
  invested: number;
  installments: number;
  withdrawn: number;
  routedToColumn3: number;
  units: number;
  value: number;
}
/** Per-fund Column 2 figures, read off the same executed transactions. */
export const column2Summary = (
  result: StrategyResult,
  navBook: NavBook,
  entry: Column2FundConfig,
  asOfDate: string
): Column2FundSummary => {
  const rows = result.transactions.filter((row) => row.configId === entry.id);
  const sips = rows.filter((row) => row.kind === 'c2-sip');
  const swps = rows.filter((row) => row.kind === 'c2-swp');
  const units = result.column2Units[entry.id] ?? 0;
  const nav = resolveNav(navBook[entry.fund.schemeCode] ?? [], asOfDate);
  return {
    invested: sips.reduce((total, row) => addMoney(total, row.settledAmount), 0),
    installments: sips.length,
    withdrawn: swps.reduce((total, row) => addMoney(total, row.settledAmount), 0),
    routedToColumn3: swps.reduce((total, row) => addMoney(total, row.routedOnward), 0),
    units,
    value: nav ? valueFor(units, nav.nav) : 0,
  };
};
/**
 * The rupee amount one instalment of this fund's SIP receives, taken from the
 * first Column 1 withdrawal period that routes money to Column 2.
 */
export const sipAmountPerInstallment = (
  config: StrategyConfig,
  allocationPct: number
): number => {
  const period = config.column1.withdrawals.find((entry) => entry.toColumn2 > 0);
  return period ? roundMoney((Math.min(period.toColumn2, period.amount) * allocationPct) / 100) : 0;
};
/** Total allocation across Column 2 funds, for the 100% check shown in the UI. */
export const allocationTotal = (config: StrategyConfig): number =>
  roundMoney(config.column2.reduce((total, entry) => total + entry.allocationPct, 0));
