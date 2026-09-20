import {
  MAX_COLUMN2_FUNDS,
  createColumn2Fund,
  createWithdrawalPeriod,
  fundingStartDate,
  rebalanceAllocations,
} from './defaults';
import type {
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
export const withPatchedColumn3 = (
  config: StrategyConfig,
  patch: Partial<Column3Config>
): StrategyConfig => ({ ...config, column3: { ...config.column3, ...patch } });
