import { getTodayISO } from '../../utilities/dateGuards';
import { earliestDate } from './schedule';
import type { Column2FundConfig, FundRef, StrategyConfig, WithdrawalPeriod } from './types';
export const MAX_COLUMN2_FUNDS = 8;
/** Highest yearly withdrawal increase offered in the dropdown. */
export const MAX_STEP_UP_PCT = 20;
let idCounter = 2;
export const nextId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};
/** Resets the id counter. Used in unit tests. */
export const resetIdCounterForTests = (start = 2): void => {
  idCounter = start;
};
/**
 * Advances the id counter past a set of existing ids. Called after restoring a
 * saved config, whose ids were minted by an earlier session that started the
 * counter at zero — without this, the next new item would reuse an id and
 * collide as a React key.
 */
export const reserveIds = (ids: string[]): void => {
  for (const id of ids) {
    const trailing = Number(id.split('-').pop());
    if (Number.isFinite(trailing) && trailing > idCounter) idCounter = trailing;
  }
};
/** The Column 1 date that funds Column 2, used as the default SIP start. */
export const fundingStartDate = (withdrawals: WithdrawalPeriod[]): string | null =>
  earliestDate(withdrawals.filter((period) => period.toColumn2 > 0).map((period) => period.startDate)) ??
  earliestDate(withdrawals.map((period) => period.startDate));
export const createWithdrawalPeriod = (
  id: string,
  startDate: string,
  endDate: string
): WithdrawalPeriod => ({
  id,
  startDate,
  endDate,
  frequency: 'yearly',
  amount: 450000,
  toColumn2: 400000,
  annualStepUpPct: 0,
});
export const createColumn2Fund = (
  fund: FundRef,
  sipStartDate: string,
  asOfDate: string
): Column2FundConfig => ({
  id: nextId('c2'),
  fund,
  allocationPct: 0,
  sipStartDate,
  swp: {
    enabled: false,
    startDate: sipStartDate,
    endDate: asOfDate,
    amount: 20000,
    frequency: 'monthly',
    toColumn3: 0,
    annualStepUpPct: 0,
  },
});
/**
 * Spread allocation evenly across the selected funds and give any rounding
 * remainder to the first, so the total is always exactly 100%.
 */
export const rebalanceAllocations = (funds: Column2FundConfig[]): Column2FundConfig[] => {
  if (funds.length === 0) return funds;
  const even = Math.floor(100 / funds.length);
  const remainder = 100 - even * funds.length;
  return funds.map((entry, index) => ({
    ...entry,
    allocationPct: index === 0 ? even + remainder : even,
  }));
};
export const DEFAULT_WITHDRAWAL_IDS = ['wd-1', 'wd-2'] as const;
export const createDefaultConfig = (asOfDate = getTodayISO()): StrategyConfig => ({
  column1: {
    fund: null,
    amount: 7000000,
    investmentDate: '2018-01-01',
    withdrawals: [
      {
        id: DEFAULT_WITHDRAWAL_IDS[0],
        startDate: '2019-01-01',
        endDate: '2019-12-31',
        frequency: 'yearly',
        amount: 450000,
        toColumn2: 400000,
        annualStepUpPct: 0,
      },
      {
        id: DEFAULT_WITHDRAWAL_IDS[1],
        startDate: '2020-01-01',
        endDate: asOfDate,
        frequency: 'yearly',
        amount: 100000,
        toColumn2: 0,
        annualStepUpPct: 0,
      },
    ],
  },
  column2: [],
  column3: {
    frequency: 'monthly',
    startDate: '2024-01-01',
    mode: 'sweep',
    amount: 0,
  },
  asOfDate,
});
