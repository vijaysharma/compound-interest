import { PartPayment, RateChange, ScheduleRow } from './types';
export type RawRow = Omit<ScheduleRow, 'remainingInterest'>;
export interface RateChangeContext {
  principal: number;
  currentAnnualRate: number;
  monthlyRate: number;
  currentEmiAmount: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  remainingScheduledMonths: number;
  roiChangesCount: number;
  hasEmiAdjustment: boolean;
}
export const applyRateChanges = (
  changes: RateChange[],
  ctx: RateChangeContext,
  rawRows: RawRow[]
): void => {
  for (const rateChange of changes) {
    if (ctx.principal <= 0.01) break;
    const changeDate = new Date(rateChange.date);
    const oldRate = ctx.currentAnnualRate;
    ctx.currentAnnualRate = rateChange.rate;
    ctx.monthlyRate = ctx.currentAnnualRate / 12 / 100;
    ctx.roiChangesCount++;
    rawRows.push({
      date: changeDate.toDateString(),
      emi: '0.00',
      principal: '0.00',
      interest: '0.00',
      balance: ctx.principal.toFixed(2),
      cumulativePrincipal: ctx.cumulativePrincipal.toFixed(2),
      cumulativeInterest: ctx.cumulativeInterest.toFixed(2),
      note: `ROI Change: ${oldRate}% → ${ctx.currentAnnualRate}% (${rateChange.mode === 'emi' ? 'Adjust EMI' : 'Adjust Tenure'})`,
    });
    if (rateChange.mode === 'emi') {
      ctx.hasEmiAdjustment = true;
      if (ctx.remainingScheduledMonths > 0 && ctx.monthlyRate > 0) {
        ctx.currentEmiAmount =
          (ctx.principal * ctx.monthlyRate * Math.pow(1 + ctx.monthlyRate, ctx.remainingScheduledMonths)) /
          (Math.pow(1 + ctx.monthlyRate, ctx.remainingScheduledMonths) - 1);
      }
    }
  }
};
export interface PartPaymentContext {
  principal: number;
  monthlyRate: number;
  currentEmiAmount: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  remainingScheduledMonths: number;
  partPaymentsCount: number;
  hasEmiAdjustment: boolean;
}
export const applyPartPayments = (
  payments: PartPayment[],
  ctx: PartPaymentContext,
  rawRows: RawRow[]
): void => {
  for (const payment of payments) {
    if (ctx.principal <= 0.01) break;
    const paymentDate = new Date(payment.date);
    const actualPaymentAmount = Math.min(payment.amount, ctx.principal);
    ctx.principal -= actualPaymentAmount;
    ctx.cumulativePrincipal += actualPaymentAmount;
    ctx.partPaymentsCount++;
    rawRows.push({
      date: paymentDate.toDateString(),
      emi: actualPaymentAmount.toFixed(2),
      principal: actualPaymentAmount.toFixed(2),
      interest: '0.00',
      balance: ctx.principal.toFixed(2),
      cumulativePrincipal: ctx.cumulativePrincipal.toFixed(2),
      cumulativeInterest: ctx.cumulativeInterest.toFixed(2),
      note: `Part Payment (${payment.mode === 'emi' ? 'Reduce EMI' : 'Reduce Tenure'})`,
    });
    if (payment.mode === 'emi') {
      ctx.hasEmiAdjustment = true;
      if (ctx.remainingScheduledMonths > 0 && ctx.monthlyRate > 0 && ctx.principal > 0.01) {
        ctx.currentEmiAmount =
          (ctx.principal * ctx.monthlyRate * Math.pow(1 + ctx.monthlyRate, ctx.remainingScheduledMonths)) /
          (Math.pow(1 + ctx.monthlyRate, ctx.remainingScheduledMonths) - 1);
      }
    }
  }
};
