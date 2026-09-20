import { useMemo, useState } from 'react';
import { sanctnum } from '../../utilities/numSanitity';
import { RT } from '../../types/types';
export const calculateRemainingAmount = (
  p: string,
  r: string,
  ir: string,
  irf: string,
  t: string,
  tf: string,
  w: string
) => {
  const tenure = tf === 'y' ? sanctnum(t) * 12 : sanctnum(t);
  const principal = sanctnum(p);
  const rate = sanctnum(r);
  const withdrawal = sanctnum(w);
  const inflationRate = sanctnum(ir);
  const inflationFreq = sanctnum(irf);
  let fa = principal;
  let wa = withdrawal;
  if (tenure <= 0) return ['0', `${fa}`];
  for (let i = 1; i <= tenure; i++) {
    wa =
      inflationRate && i > inflationFreq && (i - 1) % inflationFreq === 0
        ? wa * (1 + inflationRate / 100)
        : wa;
    fa = fa * (1 + rate / 100) ** (1 / 12) - wa;
  }
  return [`${wa}`, `${fa}`];
};
export const useFixedRateSwp = () => {
  const [pa, setPa] = useState('35000000');
  const [rt, setRt] = useState('10');
  const [irt, setIRt] = useState('7');
  const [t, setT] = useState<RT>({
    tenure: '40',
    tenureFormat: 'y',
  });
  const [wa, setWa] = useState('120000');
  const [inflationFreq, setInflationFreq] = useState('12');
  const [lwa, remainingAmount] = useMemo(
    () => calculateRemainingAmount(pa, rt, irt, inflationFreq, t.tenure, t.tenureFormat, wa),
    [pa, rt, irt, inflationFreq, t.tenure, t.tenureFormat, wa]
  );
  const initialInvested = parseInt(pa) || 0;
  const finalCorpus = parseInt(remainingAmount) || 0;
  const totalMonths = (t.tenureFormat === 'y' ? sanctnum(t.tenure) : sanctnum(t.tenure) / 12) * 12;
  const approxWithdrawn = Math.round(
    (((parseInt(wa) || 0) + (parseInt(lwa) || parseInt(wa) || 0)) / 2) * totalMonths
  );
  return {
    pa,
    setPa,
    rt,
    setRt,
    irt,
    setIRt,
    t,
    setT,
    wa,
    setWa,
    inflationFreq,
    setInflationFreq,
    lwa,
    initialInvested,
    finalCorpus,
    approxWithdrawn,
  };
};
