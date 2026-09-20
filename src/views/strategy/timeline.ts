import { parseAnyDate } from '../../utilities/dateUtils';
import { navDatesBetween, resolveNav } from './navLookup';
import { isOnOrBefore } from './schedule';
import { addMoney, valueFor } from './money';
import type { ExecutedTransaction, NavBook, PortfolioSnapshot, StrategyConfig } from './types';
const byTime = (a: string, b: string): number =>
  parseAnyDate(a).getTime() - parseAnyDate(b).getTime();
/**
 * Dates at which the portfolio is valued: every business day the Column 1 fund
 * published a NAV inside the strategy window, plus every transaction date and
 * the as-of date. Between transactions the value still moves, because each
 * grid point is re-valued at that day's actual NAV.
 */
const valuationGrid = (
  config: StrategyConfig,
  navBook: NavBook,
  transactions: ExecutedTransaction[]
): string[] => {
  const schemeCode = config.column1.fund?.schemeCode;
  if (!schemeCode) return [];
  const startDate = config.column1.investmentDate;
  if (!isOnOrBefore(startDate, config.asOfDate)) return [];
  const dates = new Set(
    navDatesBetween(navBook[schemeCode] ?? [], startDate, config.asOfDate)
  );
  for (const transaction of transactions) {
    if (isOnOrBefore(startDate, transaction.date)) dates.add(transaction.date);
  }
  dates.add(config.asOfDate);
  return Array.from(dates).sort(byTime);
};
/**
 * Portfolio value over time, derived from the executed transactions rather
 * than recalculated independently — the chart and the statistics card read the
 * same units and the same NAVs.
 */
export const buildSnapshots = (
  config: StrategyConfig,
  navBook: NavBook,
  transactions: ExecutedTransaction[]
): PortfolioSnapshot[] => {
  const schemeCode = config.column1.fund?.schemeCode;
  if (!schemeCode) return [];
  const grid = valuationGrid(config, navBook, transactions);
  const column1NavData = navBook[schemeCode] ?? [];
  const column2Units: Record<string, number> = {};
  let column1Units = 0;
  let nextTransaction = 0;
  const snapshots: PortfolioSnapshot[] = [];
  for (const date of grid) {
    while (
      nextTransaction < transactions.length &&
      isOnOrBefore(transactions[nextTransaction].date, date)
    ) {
      const transaction = transactions[nextTransaction];
      if (transaction.bucket === 'column1') {
        column1Units += transaction.units;
      } else {
        const key = transaction.configId ?? transaction.schemeCode;
        column2Units[key] = (column2Units[key] ?? 0) + transaction.units;
      }
      nextTransaction += 1;
    }
    const column1Nav = resolveNav(column1NavData, date);
    const column1Value = column1Nav ? valueFor(column1Units, column1Nav.nav) : 0;
    let column2Value = 0;
    for (const entry of config.column2) {
      const units = column2Units[entry.id] ?? 0;
      if (units <= 0) continue;
      const nav = resolveNav(navBook[entry.fund.schemeCode] ?? [], date);
      if (nav) column2Value = addMoney(column2Value, valueFor(units, nav.nav));
    }
    snapshots.push({
      date,
      column1Value,
      column2Value,
      totalValue: addMoney(column1Value, column2Value),
    });
  }
  return snapshots;
};
