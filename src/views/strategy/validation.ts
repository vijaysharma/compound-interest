import { firstNavDate } from './navLookup';
import { earliestDate, isBefore } from './schedule';
import { roundMoney } from './money';
import { COLUMN_WORDS } from './labels';
import type { NavBook, StrategyConfig } from './types';
export interface ValidationIssue {
  id: string;
  message: string;
  severity: 'error' | 'warning';
}
const totalAllocation = (config: StrategyConfig): number =>
  roundMoney(config.column2.reduce((total, entry) => total + entry.allocationPct, 0));
const checkColumn1 = (config: StrategyConfig, navBook: NavBook): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const { fund, amount, investmentDate } = config.column1;
  if (!fund) {
    issues.push({
      id: 'c1-fund',
      message: `Select the ${COLUMN_WORDS.core} investment fund.`,
      severity: 'error',
    });
    return issues;
  }
  if (amount <= 0) {
    issues.push({ id: 'c1-amount', message: 'Enter an initial investment greater than zero.', severity: 'error' });
  }
  const inception = firstNavDate(navBook[fund.schemeCode] ?? []);
  if (inception && isBefore(investmentDate, inception)) {
    issues.push({
      id: 'c1-inception',
      message: `${fund.schemeName} has no NAV before ${inception}. Move the investment date on or after it.`,
      severity: 'error',
    });
  }
  if (isBefore(config.asOfDate, investmentDate)) {
    issues.push({ id: 'as-of', message: 'The as-of date cannot be before the investment date.', severity: 'error' });
  }
  return issues;
};
const checkWithdrawals = (config: StrategyConfig): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  config.column1.withdrawals.forEach((period, index) => {
    const label = `Withdrawal period ${index + 1}`;
    if (isBefore(period.startDate, config.column1.investmentDate)) {
      issues.push({ id: `wd-${period.id}-start`, message: `${label} starts before the investment date.`, severity: 'error' });
    }
    if (isBefore(period.endDate, period.startDate)) {
      issues.push({ id: `wd-${period.id}-range`, message: `${label} ends before it starts.`, severity: 'error' });
    }
    if (period.amount <= 0) {
      issues.push({ id: `wd-${period.id}-amount`, message: `${label} needs a withdrawal above zero.`, severity: 'error' });
    }
    if (period.toColumn2 > period.amount) {
      issues.push({
        id: `wd-${period.id}-split`,
        message: `${label} routes more to the ${COLUMN_WORDS.growth} than it withdraws.`,
        severity: 'error',
      });
    }
  });
  return issues;
};
const checkColumn2 = (config: StrategyConfig): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const routesMoney = config.column1.withdrawals.some((period) => period.toColumn2 > 0);
  if (!routesMoney) return issues;
  if (config.column2.length === 0) {
    issues.push({
      id: 'c2-empty',
      message: `The ${COLUMN_WORDS.core} routes money onward, so add at least one growth fund.`,
      severity: 'error',
    });
    return issues;
  }
  const allocation = totalAllocation(config);
  if (allocation !== 100) {
    issues.push({
      id: 'c2-allocation',
      message: `Fund allocation totals ${allocation}%. It must total exactly 100%.`,
      severity: 'error',
    });
  }
  const firstWithdrawal = earliestDate(config.column1.withdrawals.map((period) => period.startDate));
  config.column2.forEach((entry) => {
    if (firstWithdrawal && isBefore(entry.sipStartDate, firstWithdrawal)) {
      issues.push({
        id: `c2-${entry.id}-sip-start`,
        message: `${entry.fund.schemeName} starts its SIP before the ${COLUMN_WORDS.core} funds it (${firstWithdrawal}).`,
        severity: 'error',
      });
    }
    if (!entry.swp.enabled) return;
    if (isBefore(entry.swp.startDate, entry.sipStartDate)) {
      issues.push({
        id: `c2-${entry.id}-swp-start`,
        message: `${entry.fund.schemeName} starts its SWP before its SIP.`,
        severity: 'error',
      });
    }
    if (isBefore(entry.swp.endDate, entry.swp.startDate)) {
      issues.push({ id: `c2-${entry.id}-swp-range`, message: `${entry.fund.schemeName} SWP ends before it starts.`, severity: 'error' });
    }
    if (entry.swp.amount <= 0) {
      issues.push({ id: `c2-${entry.id}-swp-amount`, message: `${entry.fund.schemeName} needs an SWP above zero.`, severity: 'error' });
    }
    if (entry.swp.toColumn3 > entry.swp.amount) {
      issues.push({
        id: `c2-${entry.id}-swp-split`,
        message: `${entry.fund.schemeName} routes more to the ${COLUMN_WORDS.reinvest} than it withdraws.`,
        severity: 'error',
      });
    }
  });
  return issues;
};
const checkColumn3 = (config: StrategyConfig): ValidationIssue[] => {
  const feeders = config.column2.filter((entry) => entry.swp.enabled && entry.swp.toColumn3 > 0);
  if (feeders.length === 0) return [];
  const firstSwp = earliestDate(feeders.map((entry) => entry.swp.startDate));
  if (firstSwp && isBefore(config.column3.startDate, firstSwp)) {
    return [{
      id: 'c3-start',
      message: `The ${COLUMN_WORDS.reinvest} starts before any SWP reaches it (${firstSwp}); early instalments have nothing to reinvest.`,
      severity: 'warning',
    }];
  }
  if (config.column3.mode === 'fixed' && config.column3.amount <= 0) {
    return [{ id: 'c3-amount', message: 'Enter a fixed reinvestment above zero, or switch to sweep mode.', severity: 'error' }];
  }
  return [];
};
/** Every configuration problem, checked before the engine is allowed to run. */
export const validateStrategy = (config: StrategyConfig, navBook: NavBook): ValidationIssue[] => [
  ...checkColumn1(config, navBook),
  ...checkWithdrawals(config),
  ...checkColumn2(config),
  ...checkColumn3(config),
];
export const hasBlockingError = (issues: ValidationIssue[]): boolean =>
  issues.some((issue) => issue.severity === 'error');
