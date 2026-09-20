import { useState, useMemo } from 'react';
import { RT } from '../../types/types';
import { PartPayment, RateChange } from './types';
import { getTodayDateString } from './emiDateUtils';
import { sanctnum } from '../../utilities/numSanitity';
import { calculateBaseMonthlyEmi } from './calculateBaseEmi';
import { calculateAmortizationSchedule } from './calculateAmortization';
import { calculateEmiPieSlices } from './emiPieChart';
import { useEmiStorage } from './useEmiStorage';
import { useEmiModifiers } from './useEmiModifiers';
export const useEmiState = () => {
  const [loanAmount, setLoanAmount] = useState<string>('3000000');
  const [rt, setRt] = useState<RT>({ roi: '8.5', tenure: '20', tenureFormat: 'y' });
  const [disbursementDate, setDisbursementDate] = useState<string>(getTodayDateString);
  const [emiDate, setEmiDate] = useState<number>(10);
  const [partPayments, setPartPayments] = useState<PartPayment[]>([]);
  const [rateChanges, setRateChanges] = useState<RateChange[]>([]);
  const [includePrincipalInFirstEmi, setIncludePrincipalInFirstEmi] = useState<boolean>(false);
  useEmiStorage({
    loanAmount,
    setLoanAmount,
    rt,
    setRt,
    disbursementDate,
    setDisbursementDate,
    emiDate,
    setEmiDate,
    partPayments,
    setPartPayments,
    rateChanges,
    setRateChanges,
    includePrincipalInFirstEmi,
    setIncludePrincipalInFirstEmi,
  });
  const principalAmount = useMemo(() => sanctnum(loanAmount), [loanAmount]);
  const annualRate = useMemo(() => (rt.roi ? parseFloat(rt.roi) : 0), [rt.roi]);
  const tenureMonths = useMemo(
    () => (rt.tenureFormat === 'y' ? sanctnum(rt.tenure) * 12 : sanctnum(rt.tenure)),
    [rt.tenure, rt.tenureFormat]
  );
  const baseMonthlyEmi = useMemo(
    () => calculateBaseMonthlyEmi(principalAmount, annualRate, tenureMonths),
    [principalAmount, annualRate, tenureMonths]
  );
  const scheduleResult = useMemo(
    () =>
      calculateAmortizationSchedule(
        principalAmount,
        annualRate,
        tenureMonths,
        disbursementDate,
        emiDate,
        partPayments,
        rateChanges,
        includePrincipalInFirstEmi
      ),
    [principalAmount, annualRate, tenureMonths, disbursementDate, emiDate, partPayments, rateChanges, includePrincipalInFirstEmi]
  );
  const modifiers = useEmiModifiers(
    partPayments,
    setPartPayments,
    rateChanges,
    setRateChanges,
    disbursementDate,
    setDisbursementDate,
    annualRate
  );
  const totalInterest = useMemo(
    () => scheduleResult.rows.reduce((sum, row) => sum + parseFloat(row.interest), 0),
    [scheduleResult.rows]
  );
  const totalPayable = useMemo(() => principalAmount + totalInterest, [principalAmount, totalInterest]);
  const principalPercent = useMemo(
    () => (totalPayable > 0 ? (principalAmount / totalPayable) * 100 : 0),
    [principalAmount, totalPayable]
  );
  const interestPercent = useMemo(
    () => (totalPayable > 0 ? (totalInterest / totalPayable) * 100 : 0),
    [totalInterest, totalPayable]
  );
  const pieSlices = useMemo(
    () => calculateEmiPieSlices(totalPayable, principalPercent),
    [totalPayable, principalPercent]
  );
  return {
    loanAmount,
    setLoanAmount,
    rt,
    setRt,
    disbursementDate,
    emiDate,
    setEmiDate,
    partPayments,
    rateChanges,
    includePrincipalInFirstEmi,
    setIncludePrincipalInFirstEmi,
    principalAmount,
    tenureMonths,
    baseMonthlyEmi,
    scheduleResult,
    totalInterest,
    totalPayable,
    principalPercent,
    interestPercent,
    pieSlices,
    ...modifiers,
  };
};
