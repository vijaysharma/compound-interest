import { addMonths, toISO } from '../../utilities/mutual-fund/mfDateHelpers';
import { parseAnyDate } from '../../utilities/dateUtils';
import { MONTHS_PER_INTERVAL, installmentDates, isOnOrBefore, stepUpFactor } from './schedule';
import { isZeroMoney, roundMoney } from './money';
import { nextId } from './defaults';
import type { Column2FundConfig, StrategyConfig, StrategyResult, WithdrawalPeriod } from './types';
import type { ProjectionSettings } from './projectionProfiles';
export const isLiveWithdrawal = (period: WithdrawalPeriod, asOfDate: string): boolean => {
  if (isOnOrBefore(asOfDate, period.endDate)) return true;
  const dates = installmentDates(period.startDate, period.endDate, period.frequency);
  if (dates.length === 0) return false;
  const lastDate = dates[dates.length - 1];
  const nextDate = toISO(addMonths(parseAnyDate(lastDate), MONTHS_PER_INTERVAL[period.frequency]));
  return !isOnOrBefore(nextDate, asOfDate);
};
export const isLiveSwp = (swp: Column2FundConfig['swp'], asOfDate: string): boolean => {
  if (!swp.enabled) return false;
  if (isOnOrBefore(asOfDate, swp.endDate)) return true;
  const dates = installmentDates(swp.startDate, swp.endDate, swp.frequency);
  if (dates.length === 0) return false;
  const lastDate = dates[dates.length - 1];
  const nextDate = toISO(addMonths(parseAnyDate(lastDate), MONTHS_PER_INTERVAL[swp.frequency]));
  return !isOnOrBefore(nextDate, asOfDate);
};
const standingWithdrawal = (
  withdrawals: WithdrawalPeriod[],
  asOfDate: string
): WithdrawalPeriod | null => {
  const live = withdrawals.filter((period) => isLiveWithdrawal(period, asOfDate));
  if (live.length === 0) return null;
  return live.reduce((latest, period) =>
    isOnOrBefore(latest.endDate, period.endDate) ? period : latest
  );
};
const continuationPeriod = (
  period: WithdrawalPeriod,
  horizonIso: string
): WithdrawalPeriod | null => {
  const dates = installmentDates(period.startDate, period.endDate, period.frequency);
  if (dates.length === 0) return null;
  const lastDate = dates[dates.length - 1];
  const nextDate = toISO(addMonths(parseAnyDate(lastDate), MONTHS_PER_INTERVAL[period.frequency]));
  if (!isOnOrBefore(nextDate, horizonIso)) return null;
  const factor = stepUpFactor(dates.length - 1, period.frequency, period.annualStepUpPct);
  const amount = roundMoney(period.amount * factor);
  if (amount <= 0 || isZeroMoney(amount)) return null;
  return {
    id: nextId('wd-proj'),
    startDate: nextDate,
    endDate: horizonIso,
    frequency: period.frequency,
    amount,
    toColumn2: roundMoney(Math.min(period.toColumn2, period.amount) * factor),
    annualStepUpPct: period.annualStepUpPct,
  };
};
const extendSwp = (entry: Column2FundConfig, asOfDate: string, horizonIso: string) =>
  isLiveSwp(entry.swp, asOfDate) ? { ...entry, swp: { ...entry.swp, endDate: horizonIso } } : entry;
export const horizonDate = (asOfDate: string, horizonYears: number): string => {
  const base = parseAnyDate(asOfDate);
  if (!Number.isFinite(base.getTime())) return asOfDate;
  return toISO(addMonths(base, Math.round(horizonYears * 12)));
};
export const buildProjectedConfig = (
  config: StrategyConfig,
  settings: Pick<ProjectionSettings, 'horizonYears'>
): StrategyConfig => {
  const horizonIso = horizonDate(config.asOfDate, settings.horizonYears);
  const standing = standingWithdrawal(config.column1.withdrawals, config.asOfDate);
  const continuation = standing
    ? continuationPeriod(standing, horizonIso)
    : null;
  return {
    ...config,
    asOfDate: horizonIso,
    column1: {
      ...config.column1,
      withdrawals: continuation
        ? [...config.column1.withdrawals, continuation]
        : config.column1.withdrawals,
    },
    column2: config.column2.map((entry) => extendSwp(entry, config.asOfDate, horizonIso)),
  };
};
export const firstShortfall = (result: StrategyResult, afterDate: string): string | null => {
  for (const transaction of result.transactions) {
    if (transaction.kind !== 'c1-withdraw' && transaction.kind !== 'c2-swp') continue;
    if (isOnOrBefore(transaction.date, afterDate)) continue;
    if (transaction.settledAmount < transaction.amount - 0.005) return transaction.date;
  }
  return null;
};
export const firstExhausted = (result: StrategyResult, afterDate: string): string | null => {
  for (const snapshot of result.snapshots) {
    if (isOnOrBefore(snapshot.date, afterDate)) continue;
    if (isZeroMoney(snapshot.totalValue)) return snapshot.date;
  }
  return null;
};
