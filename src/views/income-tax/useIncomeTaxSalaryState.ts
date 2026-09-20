import { useState } from 'react';
import { CityCategory } from '../../utilities/incomeTaxCalculations';
export const useIncomeTaxSalaryState = () => {
  const [isSalaried, setIsSalaried] = useState<boolean>(true);
  const [grossSalary, setGrossSalary] = useState<string>('1500000');
  const [basicSalary, setBasicSalary] = useState<string>('750000');
  const [hraReceived, setHraReceived] = useState<string>('300000');
  const [rentPaid, setRentPaid] = useState<string>('240000');
  const [cityCategory, setCityCategory] = useState<CityCategory>('metro');
  const [professionalTax, setProfessionalTax] = useState<string>('2400');
  const [exemptAllowances, setExemptAllowances] = useState<string>('0');
  const [useCustomStdDeduction, setUseCustomStdDeduction] = useState<boolean>(false);
  const [customStdDeduction, setCustomStdDeduction] = useState<string>('75000');
  return {
    isSalaried,
    setIsSalaried,
    grossSalary,
    setGrossSalary,
    basicSalary,
    setBasicSalary,
    hraReceived,
    setHraReceived,
    rentPaid,
    setRentPaid,
    cityCategory,
    setCityCategory,
    professionalTax,
    setProfessionalTax,
    exemptAllowances,
    setExemptAllowances,
    useCustomStdDeduction,
    setUseCustomStdDeduction,
    customStdDeduction,
    setCustomStdDeduction,
  };
};
