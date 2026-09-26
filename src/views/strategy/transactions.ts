import { parseAnyDate } from '../../utilities/dateUtils';
import { installmentDates, isOnOrBefore, stepUpFactor } from './schedule';
import { roundMoney } from './money';
import type { PlannedTransaction, StrategyConfig, TransactionKind } from './types';
/**
 * Same-date ordering. Money has to arrive before it can be spent: a Column 1
 * withdrawal funds that day's Column 2 SIP, and a Column 2 SWP funds that day's
 * Column 3 reinvestment.
 */
const KIND_RANK: Record<TransactionKind, number> = {
  'c1-invest': 0,
  'c1-withdraw': 1,
  'c2-sip': 2,
  'c2-swp': 3,
  'c3-reinvest': 4,
};
const clampToAsOf = (endDate: string, asOfDate: string): string =>
  isOnOrBefore(endDate, asOfDate) ? endDate : asOfDate;
/** Column 1 withdrawal installments across every configured period. */
const planColumn1Withdrawals = (config: StrategyConfig): PlannedTransaction[] => {
  const fund = config.column1.fund;
  if (!fund) return [];
  return config.column1.withdrawals.flatMap((period) =>
    installmentDates(
      period.startDate,
      clampToAsOf(period.endDate, config.asOfDate),
      period.frequency
    ).map<PlannedTransaction>((date, index) => {
      const factor = stepUpFactor(index, period.frequency, period.annualStepUpPct);
      return {
        kind: 'c1-withdraw',
        date,
        bucket: 'column1',
        schemeCode: fund.schemeCode,
        amount: roundMoney(period.amount * factor),
        routedOnward: roundMoney(Math.min(period.toColumn2, period.amount) * factor),
      };
    })
  );
};
/**
 * Column 2 SIPs are funded by Column 1, so they land on the Column 1
 * withdrawal installment dates and each fund receives its allocation share of
 * the amount routed onward. A fund whose SIP start date is later than an
 * installment simply does not participate in it.
 */
const planColumn2Sips = (config: StrategyConfig): PlannedTransaction[] => {
  const rows: PlannedTransaction[] = [];
  for (const period of config.column1.withdrawals) {
    const routed = roundMoney(Math.min(period.toColumn2, period.amount));
    if (routed <= 0) continue;
    const dates = installmentDates(
      period.startDate,
      clampToAsOf(period.endDate, config.asOfDate),
      period.frequency
    );
    for (const [index, date] of dates.entries()) {
      // The SIP escalates with the withdrawal that funds it.
      const escalated = routed * stepUpFactor(index, period.frequency, period.annualStepUpPct);
      for (const entry of config.column2) {
        if (!isOnOrBefore(entry.sipStartDate, date)) continue;
        const amount = roundMoney((escalated * entry.allocationPct) / 100);
        if (amount <= 0) continue;
        rows.push({
          kind: 'c2-sip',
          date,
          bucket: 'column2',
          schemeCode: entry.fund.schemeCode,
          configId: entry.id,
          amount,
          routedOnward: 0,
        });
      }
    }
  }
  return rows;
};
/** Column 2 SWP installments, per fund. */
const planColumn2Swps = (config: StrategyConfig): PlannedTransaction[] =>
  config.column2
    .filter((entry) => entry.swp.enabled && entry.swp.amount > 0)
    .flatMap((entry) =>
      installmentDates(
        entry.swp.startDate,
        clampToAsOf(entry.swp.endDate, config.asOfDate),
        entry.swp.frequency
      ).map<PlannedTransaction>((date, index) => {
        const factor = stepUpFactor(index, entry.swp.frequency, entry.swp.annualStepUpPct ?? 0);
        return {
          kind: 'c2-swp',
          date,
          bucket: 'column2',
          schemeCode: entry.fund.schemeCode,
          configId: entry.id,
          amount: roundMoney(entry.swp.amount * factor),
          routedOnward: roundMoney(Math.min(entry.swp.toColumn3, entry.swp.amount) * factor),
        };
      })
    );
/**
 * Column 3 reinvestments into the Column 1 fund. `amount` is 0 in sweep mode,
 * which the engine reads as "invest whatever is in the Column 3 pool".
 */
const planColumn3Reinvestments = (config: StrategyConfig): PlannedTransaction[] => {
  const fund = config.column1.fund;
  const routesToColumn3 = config.column2.some(
    (entry) => entry.swp.enabled && entry.swp.toColumn3 > 0
  );
  if (!fund || !routesToColumn3) return [];
  return installmentDates(
    config.column3.startDate,
    config.asOfDate,
    config.column3.frequency
  ).map<PlannedTransaction>((date) => ({
    kind: 'c3-reinvest',
    date,
    bucket: 'column1',
    schemeCode: fund.schemeCode,
    amount: config.column3.mode === 'fixed' ? roundMoney(config.column3.amount) : 0,
    routedOnward: 0,
  }));
};
/** The complete transaction plan, in execution order. */
export const planTransactions = (config: StrategyConfig): PlannedTransaction[] => {
  const fund = config.column1.fund;
  if (!fund || config.column1.amount <= 0) return [];
  const initial: PlannedTransaction = {
    kind: 'c1-invest',
    date: config.column1.investmentDate,
    bucket: 'column1',
    schemeCode: fund.schemeCode,
    amount: roundMoney(config.column1.amount),
    routedOnward: 0,
  };
  return [
    initial,
    ...planColumn1Withdrawals(config),
    ...planColumn2Sips(config),
    ...planColumn2Swps(config),
    ...planColumn3Reinvestments(config),
  ]
    .filter((row) => isOnOrBefore(row.date, config.asOfDate))
    .sort((a, b) => {
      const byDate = parseAnyDate(a.date).getTime() - parseAnyDate(b.date).getTime();
      return byDate !== 0 ? byDate : KIND_RANK[a.kind] - KIND_RANK[b.kind];
    });
};
