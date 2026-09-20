import { useState, useMemo } from 'react';
import { calculateNPS, type NPSCalculationResult } from '../../utilities/npsCalculations';
export function useNpsState() {
  const [currentAge, setCurrentAge] = useState<number>(28);
  const [retirementAge, setRetirementAge] = useState<number>(60);
  const [monthlyContribution, setMonthlyContribution] = useState<string>('5000');
  const [hasEmployerContribution, setHasEmployerContribution] = useState<boolean>(false);
  const [employerMonthly, setEmployerMonthly] = useState<string>('5000');
  const [expectedRoi, setExpectedRoi] = useState<number>(10.0);
  const [annuityPercent, setAnnuityPercent] = useState<number>(40);
  const [annuityRate, setAnnuityRate] = useState<number>(6.0);
  const numericSelf = useMemo(() => {
    return Math.max(500, Number(monthlyContribution.replace(/[^0-9]/g, '')) || 500);
  }, [monthlyContribution]);
  const numericEmployer = useMemo(() => {
    if (!hasEmployerContribution) return 0;
    return Math.max(0, Number(employerMonthly.replace(/[^0-9]/g, '')) || 0);
  }, [hasEmployerContribution, employerMonthly]);
  const npsResult: NPSCalculationResult = useMemo(() => {
    return calculateNPS({
      currentAge,
      retirementAge,
      monthlyContribution: numericSelf,
      employerContribution: numericEmployer,
      expectedRoi,
      annuityPercent,
      annuityRate,
    });
  }, [
    currentAge,
    retirementAge,
    numericSelf,
    numericEmployer,
    expectedRoi,
    annuityPercent,
    annuityRate,
  ]);
  const wealthMultiple = (npsResult.totalCorpus / (npsResult.totalInvested || 1)).toFixed(1);
  return {
    currentAge, setCurrentAge,
    retirementAge, setRetirementAge,
    monthlyContribution, setMonthlyContribution,
    hasEmployerContribution, setHasEmployerContribution,
    employerMonthly, setEmployerMonthly,
    expectedRoi, setExpectedRoi,
    annuityPercent, setAnnuityPercent,
    annuityRate, setAnnuityRate,
    npsResult,
    wealthMultiple,
  };
}
