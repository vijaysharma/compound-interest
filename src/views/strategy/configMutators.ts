import {
  MAX_COLUMN2_FUNDS,
  createColumn2Fund,
  createWithdrawalPeriod,
  fundingStartDate,
  rebalanceAllocations,
} from './defaults';
import { addMonths, toISO } from '../../utilities/mutual-fund/mfDateHelpers';
import { parseAnyDate } from '../../utilities/dateUtils';
import { roundMoney } from './money';
import type {
  BulkSwpConfig,
  CascadeInterval,
  Column1Config,
  Column2FundConfig,
  Column3Config,
  FundRef,
  StrategyConfig,
  SwpRule,
  WithdrawalPeriod,
} from './types';
/**
 * Pure state transforms. Keeping them out of the hook makes each one readable
 * in isolation and keeps the React layer to plain `setConfig(fn)` calls.
 */
export const withColumn1 = (
  config: StrategyConfig,
  patch: Partial<Column1Config>
): StrategyConfig => ({ ...config, column1: { ...config.column1, ...patch } });
export const withAddedWithdrawal = (config: StrategyConfig, id: string): StrategyConfig => {
  const last = config.column1.withdrawals.at(-1);
  const startDate = last?.endDate ?? config.column1.investmentDate;
  return withColumn1(config, {
    withdrawals: [
      ...config.column1.withdrawals,
      createWithdrawalPeriod(id, startDate, config.asOfDate),
    ],
  });
};
export const withPatchedWithdrawal = (
  config: StrategyConfig,
  id: string,
  patch: Partial<WithdrawalPeriod>
): StrategyConfig =>
  withColumn1(config, {
    withdrawals: config.column1.withdrawals.map((period) =>
      period.id === id ? { ...period, ...patch } : period
    ),
  });
export const withoutWithdrawal = (config: StrategyConfig, id: string): StrategyConfig =>
  withColumn1(config, {
    withdrawals: config.column1.withdrawals.filter((period) => period.id !== id),
  });
/**
 * Adds or removes a Column 2 fund. A new fund inherits its SIP start date from
 * the Column 1 withdrawal that funds it, and allocation is re-spread evenly so
 * the total stays at 100%.
 */
export const withToggledColumn2Fund = (
  config: StrategyConfig,
  fund: FundRef
): StrategyConfig => {
  const existing = config.column2.find((entry) => entry.fund.schemeCode === fund.schemeCode);
  if (existing) {
    return {
      ...config,
      column2: rebalanceAllocations(config.column2.filter((entry) => entry.id !== existing.id)),
    };
  }
  if (config.column2.length >= MAX_COLUMN2_FUNDS) return config;
  const sipStartDate =
    fundingStartDate(config.column1.withdrawals) ?? config.column1.investmentDate;
  return {
    ...config,
    column2: rebalanceAllocations([
      ...config.column2,
      createColumn2Fund(fund, sipStartDate, config.asOfDate),
    ]),
  };
};
export const withPatchedColumn2 = (
  config: StrategyConfig,
  id: string,
  patch: Partial<Column2FundConfig>
): StrategyConfig => ({
  ...config,
  column2: config.column2.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
});
export const withPatchedSwp = (
  config: StrategyConfig,
  id: string,
  patch: Partial<SwpRule>
): StrategyConfig => ({
  ...config,
  column2: config.column2.map((entry) =>
    entry.id === id ? { ...entry, swp: { ...entry.swp, ...patch } } : entry
  ),
});
export const CASCADE_INTERVAL_MONTHS: Record<CascadeInterval, number> = {
  '1 Month': 1,
  '1 Quarter': 3,
  '6 Months': 6,
  '1 Year': 12,
};
export const CASCADE_INTERVAL_OPTIONS: { label: string; value: CascadeInterval; months: number }[] = [
  { label: '1 Month', value: '1 Month', months: 1 },
  { label: '1 Quarter', value: '1 Quarter', months: 3 },
  { label: '6 Months', value: '6 Months', months: 6 },
  { label: '1 Year', value: '1 Year', months: 12 },
];
export const cascadeDate = (baseDate: string, monthsOffset: number): string => {
  if (!baseDate || monthsOffset === 0) return baseDate;
  const d = parseAnyDate(baseDate);
  if (!Number.isFinite(d.getTime())) return baseDate;
  return toISO(addMonths(d, monthsOffset));
};
export const withBulkSwp = (
  config: StrategyConfig,
  params: BulkSwpConfig
): StrategyConfig => {
  const months = CASCADE_INTERVAL_MONTHS[params.cascadeInterval] ?? 3;
  const swpAmount = roundMoney(Math.max(0, params.swpAmount));
  const reinvestmentAmount = roundMoney(Math.max(0, Math.min(params.reinvestmentAmount, swpAmount)));
  return {
    ...config,
    column2: config.column2.map((entry, index) => {
      const offset = index * months;
      return {
        ...entry,
        swp: {
          ...entry.swp,
          enabled: true,
          amount: swpAmount,
          toColumn3: reinvestmentAmount,
          frequency: params.frequency,
          startDate: cascadeDate(params.startDate, offset),
          endDate: cascadeDate(params.endDate, offset),
        },
      };
    }),
  };
};
export const isFundOverridden = (
  entry: Column2FundConfig,
  index: number,
  params: BulkSwpConfig
): boolean => {
  const months = CASCADE_INTERVAL_MONTHS[params.cascadeInterval] ?? 3;
  const offset = index * months;
  const expectedStart = cascadeDate(params.startDate, offset);
  const expectedEnd = cascadeDate(params.endDate, offset);
  const expectedReinvest = Math.min(params.reinvestmentAmount, params.swpAmount);
  if (!entry.swp.enabled) return true;
  if (entry.swp.amount !== params.swpAmount) return true;
  if (entry.swp.toColumn3 !== expectedReinvest) return true;
  if (entry.swp.frequency !== params.frequency) return true;
  if (entry.swp.startDate !== expectedStart) return true;
  if (entry.swp.endDate !== expectedEnd) return true;
  return false;
};
export const withDisabledSwp = (config: StrategyConfig): StrategyConfig => ({
  ...config,
  column2: config.column2.map((entry) => ({
    ...entry,
    swp: {
      ...entry.swp,
      enabled: false,
    },
  })),
});
export const withPatchedColumn3 = (
  config: StrategyConfig,
  patch: Partial<Column3Config>
): StrategyConfig => ({ ...config, column3: { ...config.column3, ...patch } });
