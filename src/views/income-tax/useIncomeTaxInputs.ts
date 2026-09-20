import { useState, useMemo } from 'react';
import {
  AgeCategory,
  FinancialYear,
  compareTaxRegimes,
  getLatestRunningFinancialYear,
} from '../../utilities/incomeTaxCalculations';
import { useIncomeTaxDeductions } from './useIncomeTaxDeductions';
import { useIncomeTaxSalaryState } from './useIncomeTaxSalaryState';
import { buildTaxIncomeInputs } from './buildTaxIncomeInputs';
export const useIncomeTaxInputs = () => {
  const [financialYear, setFinancialYear] = useState<FinancialYear>(getLatestRunningFinancialYear());
  const [ageCategory, setAgeCategory] = useState<AgeCategory>('general');
  const salary = useIncomeTaxSalaryState();
  // Business / Profession
  const [businessIncome, setBusinessIncome] = useState<string>('0');
  // House property
  const [isSelfOccupied, setIsSelfOccupied] = useState<boolean>(true);
  const [rentalIncome, setRentalIncome] = useState<string>('0');
  const [municipalTaxes, setMunicipalTaxes] = useState<string>('0');
  const [homeLoanInterestProperty, setHomeLoanInterestProperty] = useState<string>('0');
  // Capital Gains
  const [equityStcg, setEquityStcg] = useState<string>('0');
  const [equityLtcg, setEquityLtcg] = useState<string>('0');
  const [otherCapitalGains, setOtherCapitalGains] = useState<string>('0');
  // Other Sources
  const [savingsInterest, setSavingsInterest] = useState<string>('15000');
  const [fdInterest, setFdInterest] = useState<string>('0');
  const [ppfInterest, setPpfInterest] = useState<string>('50000');
  const [otherIncome, setOtherIncome] = useState<string>('0');
  const deductions = useIncomeTaxDeductions();
  const inputs = useMemo(
    () =>
      buildTaxIncomeInputs({
        financialYear,
        ageCategory,
        ...salary,
        businessIncome,
        isSelfOccupied,
        rentalIncome,
        municipalTaxes,
        homeLoanInterestProperty,
        equityStcg,
        equityLtcg,
        otherCapitalGains,
        savingsInterest,
        fdInterest,
        ppfInterest,
        otherIncome,
        deductions,
      }),
    [
      financialYear,
      ageCategory,
      salary,
      businessIncome,
      isSelfOccupied,
      rentalIncome,
      municipalTaxes,
      homeLoanInterestProperty,
      equityStcg,
      equityLtcg,
      otherCapitalGains,
      savingsInterest,
      fdInterest,
      ppfInterest,
      otherIncome,
      deductions,
    ]
  );
  const comparison = useMemo(() => compareTaxRegimes(inputs), [inputs]);
  return {
    financialYear,
    setFinancialYear,
    ageCategory,
    setAgeCategory,
    ...salary,
    businessIncome,
    setBusinessIncome,
    isSelfOccupied,
    setIsSelfOccupied,
    rentalIncome,
    setRentalIncome,
    municipalTaxes,
    setMunicipalTaxes,
    homeLoanInterestProperty,
    setHomeLoanInterestProperty,
    equityStcg,
    setEquityStcg,
    equityLtcg,
    setEquityLtcg,
    otherCapitalGains,
    setOtherCapitalGains,
    savingsInterest,
    setSavingsInterest,
    fdInterest,
    setFdInterest,
    ppfInterest,
    setPpfInterest,
    otherIncome,
    setOtherIncome,
    deductions,
    inputs,
    comparison,
  };
};
