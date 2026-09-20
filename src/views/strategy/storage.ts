import { getTodayISO } from '../../utilities/dateGuards';
import { MAX_COLUMN2_FUNDS, reserveIds } from './defaults';
import {
  asArray,
  asIsoDate,
  asMoney,
  asRecord,
  parseColumn2Fund,
  parseColumn3,
  parseFund,
  parseWithdrawal,
} from './storageParsers';
import type { Column2FundConfig, StrategyConfig, WithdrawalPeriod } from './types';
export const STRATEGY_STORAGE_KEY = 'mutual_fund_strategy_state';
/**
 * Rebuilds a usable config from a stored blob, dropping anything malformed.
 * Returns null when the blob is unusable, so the caller keeps its defaults.
 */
export const parseStoredConfig = (value: unknown): StrategyConfig | null => {
  const raw = asRecord(value);
  const column1 = asRecord(raw?.column1);
  if (!raw || !column1) return null;
  /*
   * The as-of date is deliberately not restored. It is not user-editable, it
   * means "value the portfolio as of now", and reusing a stored one would
   * silently freeze the valuation on whatever day the config was last saved.
   */
  const today = getTodayISO();
  const config: StrategyConfig = {
    column1: {
      fund: parseFund(column1.fund, 0),
      amount: asMoney(column1.amount),
      investmentDate: asIsoDate(column1.investmentDate, today),
      withdrawals: asArray(column1.withdrawals)
        .map((entry, index) => parseWithdrawal(entry, index, today))
        .filter((entry): entry is WithdrawalPeriod => entry !== null),
    },
    column2: asArray(raw.column2)
      .map((entry, index) => parseColumn2Fund(entry, index, today))
      .filter((entry): entry is Column2FundConfig => entry !== null)
      .slice(0, MAX_COLUMN2_FUNDS),
    column3: parseColumn3(raw.column3, today),
    asOfDate: today,
  };
  // Ids minted after a restore must not collide with the ones just restored.
  reserveIds([
    ...config.column1.withdrawals.map((period) => period.id),
    ...config.column2.map((entry) => entry.id),
  ]);
  return config;
};
export const loadStoredConfig = (): StrategyConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = window.localStorage.getItem(STRATEGY_STORAGE_KEY);
    return saved ? parseStoredConfig(JSON.parse(saved)) : null;
  } catch (err) {
    console.warn('Failed to restore strategy state:', err);
    return null;
  }
};
export const saveStoredConfig = (config: StrategyConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STRATEGY_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('Failed to persist strategy state:', err);
  }
};
export const clearStoredConfig = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STRATEGY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear strategy state:', err);
  }
};
