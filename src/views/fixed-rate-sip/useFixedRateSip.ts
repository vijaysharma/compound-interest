import { useMemo, useState } from 'react';
import { sanctnum } from '../../utilities/numSanitity';
import { RT } from '../../types/types';
export const calculateSip = (p: string, t: string, tf: string, invType: string, r?: string) => {
  const tenure = tf === 'y' ? sanctnum(t) : sanctnum(t) / 12;
  const principal = sanctnum(p);
  const rate = r ? sanctnum(r) / 100 : 0;
  const n = 12;
  let fa = 0;
  if (invType === 'my') {
    for (let i = 1; i <= tenure * n; i++) {
      fa += principal * Math.pow(1 + rate / n, n * (i / 12));
    }
  } else {
    let sum = 0;
    for (let i = 1; i <= tenure * n; i++) {
      sum += Math.pow(1 + rate / n, n * (i / 12));
    }
    fa = principal / sum;
  }
  return sanctnum(fa);
};
export const useFixedRateSip = () => {
  const [pa, setPa] = useState('10000');
  const [rt, setRt] = useState<RT>({
    roi: '12',
    tenure: '5',
    tenureFormat: 'y',
  });
  const [invType, setInvType] = useState('my');
  const payoutAmount = useMemo(
    () => Math.ceil(calculateSip(pa, rt.tenure, rt.tenureFormat, invType, rt.roi)),
    [pa, rt.tenure, rt.tenureFormat, invType, rt.roi]
  );
  const { totalInvested, estimatedReturns } = useMemo(() => {
    const tenureYears = rt.tenureFormat === 'y' ? sanctnum(rt.tenure) : sanctnum(rt.tenure) / 12;
    const months = Math.round(tenureYears * 12);
    if (invType === 'my') {
      const monthly = sanctnum(pa);
      const invested = Math.round(monthly * months);
      const maturity = payoutAmount;
      const returns = Math.max(0, maturity - invested);
      return { totalInvested: invested, estimatedReturns: returns };
    } else {
      const monthlyReq = payoutAmount;
      const invested = Math.round(monthlyReq * months);
      const target = sanctnum(pa);
      const returns = Math.max(0, target - invested);
      return { totalInvested: invested, estimatedReturns: returns };
    }
  }, [pa, rt.tenure, rt.tenureFormat, invType, payoutAmount]);
  const investedPercent = useMemo(() => {
    const total = totalInvested + estimatedReturns;
    if (total <= 0) return 50;
    return Math.min(100, Math.max(0, Math.round((totalInvested / total) * 100)));
  }, [totalInvested, estimatedReturns]);
  return {
    pa,
    setPa,
    rt,
    setRt,
    invType,
    setInvType,
    payoutAmount,
    totalInvested,
    estimatedReturns,
    investedPercent,
  };
};
