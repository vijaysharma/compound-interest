import { PartPayment, RateChange, ScheduleCalculationResult } from './types';
import { addMonths } from './emiDateUtils';
import {
  applyRateChanges,
  applyPartPayments,
  RawRow,
  RateChangeContext,
  PartPaymentContext,
} from './amortizationEvents';
import { processProratedFirstEmi } from './amortizationProrate';
export const calculateAmortizationSchedule = (
  principalAmount: number,
  annualRate: number,
  tenureMonths: number,
  disbursementDate: string,
  emiDate: number,
  partPayments: PartPayment[],
  rateChanges: RateChange[],
  includePrincipalInFirstEmi: boolean
): ScheduleCalculationResult => {
  if (!disbursementDate || principalAmount <= 0 || tenureMonths <= 0) {
    return {
      rows: [],
      currentEmi: 0,
      regularEmisCount: 0,
      partPaymentsCount: 0,
      roiChangesCount: 0,
      totalPaymentsCount: 0,
      hasEmiAdjustment: false,
    };
  }
  const sortedPartPayments = [...partPayments]
    .filter((p) => p.enabled && p.amount > 0 && p.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sortedRateChanges = [...rateChanges]
    .filter((r) => r.enabled && r.rate > 0 && r.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const rawRows: RawRow[] = [];
  const prorated = processProratedFirstEmi(
    disbursementDate,
    emiDate,
    principalAmount,
    annualRate,
    tenureMonths,
    includePrincipalInFirstEmi,
    rawRows
  );
  let { principal, cumulativePrincipal, cumulativeInterest, regularEmisCount, remainingScheduledMonths } = prorated;
  let currentAnnualRate = annualRate;
  let monthlyRate = currentAnnualRate / 12 / 100;
  let currentEmiAmount = prorated.initialEmiAmount;
  let partPaymentsCount = 0;
  let roiChangesCount = 0;
  let hasEmiAdjustment = false;
  let currentDate = prorated.firstEmiDate;
  let monthCounter = 1;
  while (principal > 0.01 && monthCounter <= tenureMonths + 240) {
    const nextEmiDate = addMonths(currentDate, 1);
    const rateChangesInPeriod = sortedRateChanges.filter((r) => {
      const d = new Date(r.date);
      return d > currentDate && d <= nextEmiDate;
    });
    const rateCtx: RateChangeContext = {
      principal,
      currentAnnualRate,
      monthlyRate,
      currentEmiAmount,
      cumulativePrincipal,
      cumulativeInterest,
      remainingScheduledMonths,
      roiChangesCount,
      hasEmiAdjustment,
    };
    applyRateChanges(rateChangesInPeriod, rateCtx, rawRows);
    ({ currentAnnualRate, monthlyRate, currentEmiAmount, roiChangesCount, hasEmiAdjustment } = rateCtx);
    const partPaymentsInPeriod = sortedPartPayments.filter((p) => {
      const d = new Date(p.date);
      return d > currentDate && d <= nextEmiDate;
    });
    const paymentCtx: PartPaymentContext = {
      principal,
      monthlyRate,
      currentEmiAmount,
      cumulativePrincipal,
      cumulativeInterest,
      remainingScheduledMonths,
      partPaymentsCount,
      hasEmiAdjustment,
    };
    applyPartPayments(partPaymentsInPeriod, paymentCtx, rawRows);
    ({ principal, cumulativePrincipal, partPaymentsCount, currentEmiAmount, hasEmiAdjustment } = paymentCtx);
    if (principal <= 0.01) break;
    const interest = principal * monthlyRate;
    let principalComponent = currentEmiAmount - interest;
    let emiForThisMonth = currentEmiAmount;
    if (principalComponent >= principal || principal + interest <= currentEmiAmount) {
      principalComponent = principal;
      emiForThisMonth = principalComponent + interest;
      principal = 0;
    } else {
      principal -= principalComponent;
    }
    cumulativePrincipal += principalComponent;
    cumulativeInterest += interest;
    remainingScheduledMonths = Math.max(1, remainingScheduledMonths - 1);
    regularEmisCount++;
    rawRows.push({
      date: nextEmiDate.toDateString(),
      emi: emiForThisMonth.toFixed(2),
      principal: principalComponent.toFixed(2),
      interest: interest.toFixed(2),
      balance: Math.max(0, principal).toFixed(2),
      cumulativePrincipal: cumulativePrincipal.toFixed(2),
      cumulativeInterest: cumulativeInterest.toFixed(2),
    });
    currentDate = nextEmiDate;
    monthCounter++;
  }
  const totalScheduleInterest = cumulativeInterest;
  return {
    rows: rawRows.map((row) => ({
      ...row,
      remainingInterest: Math.max(0, totalScheduleInterest - parseFloat(row.cumulativeInterest)).toFixed(2),
    })),
    currentEmi: principalAmount > 0 && regularEmisCount > 0 ? currentEmiAmount : 0,
    regularEmisCount,
    partPaymentsCount,
    roiChangesCount,
    totalPaymentsCount: regularEmisCount + partPaymentsCount,
    hasEmiAdjustment,
  };
};
