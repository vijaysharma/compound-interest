import type { CashFlow } from './mfCalcTypes';
export const toDate = (date: string): Date => {
  const parts = date.split('-').map(Number);
  if (date.split('-')[0].length === 4) {
    const [year, month, day] = parts;
    return new Date(year, month - 1, day);
  }
  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
};
export const calculateXirr = (cashFlows: CashFlow[]): number | undefined => {
  if (cashFlows.length < 2) return undefined;
  const baseDate = toDate(cashFlows[0].date).getTime();
  const years = (date: string) => (toDate(date).getTime() - baseDate) / (365.25 * 86400000);
  const valueAt = (rate: number) =>
    cashFlows.reduce(
      (total, flow) => total + flow.amount / Math.pow(1 + rate, years(flow.date)),
      0
    );
  const derivativeAt = (rate: number) =>
    cashFlows.reduce(
      (total, flow) =>
        total - (years(flow.date) * flow.amount) / Math.pow(1 + rate, years(flow.date) + 1),
      0
    );
  let rate = 0.1;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const value = valueAt(rate);
    const derivative = derivativeAt(rate);
    if (!Number.isFinite(value) || !Number.isFinite(derivative) || derivative === 0) break;
    const nextRate = rate - value / derivative;
    if (nextRate <= -1 || !Number.isFinite(nextRate)) break;
    if (Math.abs(nextRate - rate) < 1e-10) return nextRate;
    rate = nextRate;
  }
  return Math.abs(valueAt(rate)) < 0.01 ? rate : undefined;
};
