import { useMemo } from 'react';
import type { RT } from '../../types/types';
import type { RdCalculations, RdTaxAnalysis } from './types';
import { sanctnum } from '../../utilities/numSanitity';
function calculateRd(p: string, t: string, tf: string, invType: string, r?: string): number {
  const tenure = tf === 'y' ? sanctnum(t) : sanctnum(t) / 12;
  const principal = sanctnum(p);
  const rate = r ? sanctnum(r) / 100 : 0;
  const n = 4;
  const totalMonths = tenure * 12;
  let fa = 0;
  if (invType === 'my') {
    for (let i = 1; i <= totalMonths; i++) {
      const monthsLeft = totalMonths - i + 1;
      const yearsLeft = monthsLeft / 12;
      fa += principal * Math.pow(1 + rate / n, n * yearsLeft);
    }
  } else {
    let sum = 0;
    for (let i = 1; i <= totalMonths; i++) {
      const monthsLeft = totalMonths - i + 1;
      const yearsLeft = monthsLeft / 12;
      sum += Math.pow(1 + rate / n, n * yearsLeft);
    }
    fa = principal / sum;
  }
  return sanctnum(fa);
}
export function useRdCalculations(
  pa: string,
  rt: RT,
  invType: string,
  taxSlab: number,
  isSeniorCitizen: boolean
): RdCalculations {
  const payoutAmount = useMemo(
    () => Math.ceil(calculateRd(pa, rt.tenure, rt.tenureFormat, invType, rt.roi)),
    [pa, rt.tenure, rt.tenureFormat, invType, rt.roi]
  );
  const tenureYears = useMemo(() => {
    const raw = sanctnum(rt.tenure);
    return rt.tenureFormat === 'y' ? raw : raw / 12;
  }, [rt.tenure, rt.tenureFormat]);
  const { totalDeposited, totalInterestEarned } = useMemo(() => {
    const months = Math.round(tenureYears * 12);
    if (invType === 'my') {
      const monthly = sanctnum(pa);
      const deposited = Math.round(monthly * months);
      const interest = Math.max(0, payoutAmount - deposited);
      return { totalDeposited: deposited, totalInterestEarned: interest };
    }
    const monthlyReq = payoutAmount;
    const deposited = Math.round(monthlyReq * months);
    const target = sanctnum(pa);
    const interest = Math.max(0, target - deposited);
    return { totalDeposited: deposited, totalInterestEarned: interest };
  }, [pa, tenureYears, invType, payoutAmount]);
  const depositPercent = useMemo(() => {
    const total = totalDeposited + totalInterestEarned;
    if (total <= 0) return 50;
    return Math.min(100, Math.max(0, Math.round((totalDeposited / total) * 100)));
  }, [totalDeposited, totalInterestEarned]);
  const taxAnalysis = useMemo<RdTaxAnalysis>(() => {
    const maxSec80TTB = isSeniorCitizen ? Math.min(totalInterestEarned, 50000 * Math.max(1, Math.ceil(tenureYears))) : 0;
    const taxableInterest = Math.max(0, totalInterestEarned - maxSec80TTB);
    const effectiveRate = (taxSlab / 100) * 1.04;
    const estimatedTax = Math.round(taxableInterest * effectiveRate);
    const postTaxInterest = Math.max(0, totalInterestEarned - estimatedTax);
    const postTaxMaturity = totalDeposited + postTaxInterest;
    const postTaxCagr = totalDeposited > 0 && tenureYears > 0
      ? ((postTaxInterest / totalDeposited / tenureYears) * 100).toFixed(2)
      : '0.00';
    const annualInterest = tenureYears > 0 ? totalInterestEarned / tenureYears : totalInterestEarned;
    const tdsThreshold = isSeniorCitizen ? 50000 : 40000;
    const isTdsApplicable = annualInterest > tdsThreshold;
    return {
      maxSec80TTB, taxableInterest, estimatedTax, postTaxInterest,
      postTaxMaturity, postTaxCagr, annualInterest, tdsThreshold, isTdsApplicable,
    };
  }, [totalInterestEarned, totalDeposited, tenureYears, isSeniorCitizen, taxSlab]);
  return { payoutAmount, totalDeposited, totalInterestEarned, depositPercent, tenureYears, taxAnalysis };
}
