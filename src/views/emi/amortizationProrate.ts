import { differenceInDays, addMonths } from './emiDateUtils';
import { RawRow } from './amortizationEvents';
export interface ProratedFirstEmiResult {
  firstEmiDate: Date;
  proratedInterest: number;
  initialEmiAmount: number;
  principal: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  regularEmisCount: number;
  remainingScheduledMonths: number;
}
export const processProratedFirstEmi = (
  disbursementDate: string,
  emiDate: number,
  principalAmount: number,
  annualRate: number,
  tenureMonths: number,
  includePrincipalInFirstEmi: boolean,
  rawRows: RawRow[]
): ProratedFirstEmiResult => {
  const currentDate = new Date(disbursementDate);
  let firstEmiDate = new Date(currentDate);
  firstEmiDate.setDate(emiDate);
  if (firstEmiDate <= currentDate) {
    firstEmiDate = addMonths(firstEmiDate, 1);
  }
  const days = differenceInDays(firstEmiDate, currentDate);
  const proratedInterest = (principalAmount * annualRate * days) / (365 * 100);
  const monthlyRate = annualRate / 12 / 100;
  const initialEmiAmount =
    monthlyRate > 0
      ? (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      : principalAmount / tenureMonths;
  let principal = principalAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  let regularEmisCount = 0;
  let remainingScheduledMonths = tenureMonths;
  if (includePrincipalInFirstEmi) {
    const principalComp = Math.min(principal, Math.max(0, initialEmiAmount - principal * monthlyRate));
    const totalFirstEmi = proratedInterest + principalComp;
    principal -= principalComp;
    cumulativePrincipal += principalComp;
    cumulativeInterest += proratedInterest;
    regularEmisCount = 1;
    remainingScheduledMonths = Math.max(1, remainingScheduledMonths - 1);
    rawRows.push({
      date: firstEmiDate.toDateString(),
      emi: totalFirstEmi.toFixed(2),
      principal: principalComp.toFixed(2),
      interest: proratedInterest.toFixed(2),
      balance: principal.toFixed(2),
      cumulativePrincipal: cumulativePrincipal.toFixed(2),
      cumulativeInterest: cumulativeInterest.toFixed(2),
      note: 'Prorated Interest + Principal',
    });
  } else {
    cumulativeInterest += proratedInterest;
    regularEmisCount = 1;
    rawRows.push({
      date: firstEmiDate.toDateString(),
      emi: proratedInterest.toFixed(2),
      principal: '0.00',
      interest: proratedInterest.toFixed(2),
      balance: principal.toFixed(2),
      cumulativePrincipal: cumulativePrincipal.toFixed(2),
      cumulativeInterest: cumulativeInterest.toFixed(2),
      note: 'Prorated Interest Only',
    });
  }
  return {
    firstEmiDate,
    proratedInterest,
    initialEmiAmount,
    principal,
    cumulativePrincipal,
    cumulativeInterest,
    regularEmisCount,
    remainingScheduledMonths,
  };
};
