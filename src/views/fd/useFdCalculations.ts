import { useMemo } from 'react';
import type { RT } from '../../types/types';
import type { FdCalculations, FdTaxAnalysis } from './types';
import { calculateInterest, calculatePrincipal } from '../../utilities/utility';
import { sanctnum } from '../../utilities/numSanitity';
import { PAYOUT_MODE_DATA } from '../../data/default_data';
export function useFdCalculations(
  pa: string,
  rt: RT,
  mode: string,
  frequency: string,
  invType: string,
  taxSlab: number,
  isSeniorCitizen: boolean
): FdCalculations {
  const payoutAmount = useMemo(() => {
    const rtRoi = rt.roi ? rt.roi : '0';
    const finalAmount =
      invType === 'tgt'
        ? calculatePrincipal(pa, rtRoi, frequency, rt.tenure, rt.tenureFormat)
        : calculateInterest(pa, rtRoi, mode, frequency, rt.tenure, rt.tenureFormat);
    if (mode === '100' && invType === 'inv') {
      return Math.round(finalAmount) + Math.round(parseFloat(pa));
    }
    return Math.round(finalAmount);
  }, [pa, rt, mode, invType, frequency]);
  const tenureMonths = useMemo(() => {
    const raw = sanctnum(rt.tenure);
    return rt.tenureFormat === 'y' ? raw * 12 : raw;
  }, [rt.tenure, rt.tenureFormat]);
  const tenureYears = useMemo(() => {
    const raw = sanctnum(rt.tenure);
    return rt.tenureFormat === 'y' ? raw : raw / 12;
  }, [rt.tenure, rt.tenureFormat]);
  const { principalDeposit, totalInterestEarned } = useMemo(() => {
    if (invType === 'inv') {
      const principal = sanctnum(pa);
      if (mode === '100') {
        const interest = Math.max(0, payoutAmount - principal);
        return { principalDeposit: principal, totalInterestEarned: interest };
      }
      const modeMonths = sanctnum(mode) || 1;
      const numPayouts = Math.max(1, tenureMonths / modeMonths);
      const interest = Math.round(payoutAmount * numPayouts);
      return { principalDeposit: principal, totalInterestEarned: interest };
    }
    const target = sanctnum(pa);
    const principal = payoutAmount;
    const interest = Math.max(0, target - principal);
    return { principalDeposit: principal, totalInterestEarned: interest };
  }, [pa, invType, payoutAmount, mode, tenureMonths]);
  const principalPercent = useMemo(() => {
    const total = principalDeposit + totalInterestEarned;
    if (total <= 0) return 50;
    return Math.min(100, Math.max(0, Math.round((principalDeposit / total) * 100)));
  }, [principalDeposit, totalInterestEarned]);
  const taxAnalysis = useMemo<FdTaxAnalysis>(() => {
    const numPayouts = mode === '100' ? 1 : Math.max(1, Math.round(tenureMonths / (sanctnum(mode) || 1)));
    const maxSec80TTB = isSeniorCitizen ? Math.min(totalInterestEarned, 50000 * Math.max(1, Math.ceil(tenureYears))) : 0;
    const taxableInterest = Math.max(0, totalInterestEarned - maxSec80TTB);
    const effectiveRate = (taxSlab / 100) * 1.04;
    const estimatedTax = Math.round(taxableInterest * effectiveRate);
    const postTaxInterest = Math.max(0, totalInterestEarned - estimatedTax);
    const postTaxMaturity = principalDeposit + postTaxInterest;
    const postTaxCagr = principalDeposit > 0 && tenureYears > 0
      ? ((Math.pow(postTaxMaturity / principalDeposit, 1 / tenureYears) - 1) * 100).toFixed(2)
      : '0.00';
    const annualInterest = tenureYears > 0 ? totalInterestEarned / tenureYears : totalInterestEarned;
    const tdsThreshold = isSeniorCitizen ? 50000 : 40000;
    const isTdsApplicable = annualInterest > tdsThreshold;
    const periodicTax = mode !== '100' && numPayouts > 0 ? Math.round(estimatedTax / numPayouts) : 0;
    const postTaxPeriodicPayout = mode !== '100' ? Math.max(0, payoutAmount - periodicTax) : 0;
    return {
      maxSec80TTB, taxableInterest, estimatedTax, postTaxInterest, postTaxMaturity,
      postTaxCagr, annualInterest, tdsThreshold, isTdsApplicable, numPayouts,
      periodicTax, postTaxPeriodicPayout,
    };
  }, [totalInterestEarned, principalDeposit, tenureYears, tenureMonths, isSeniorCitizen, taxSlab, mode, payoutAmount]);
  const selectedPayoutTitle = useMemo(
    () => PAYOUT_MODE_DATA.find((el) => el.value === mode)?.title || 'Payout',
    [mode]
  );
  return {
    payoutAmount, tenureMonths, tenureYears, principalDeposit,
    totalInterestEarned, principalPercent, taxAnalysis, selectedPayoutTitle,
  };
}
