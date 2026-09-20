import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { CityCategory, FinancialYear } from '../../utilities/incomeTaxCalculations';
import { SALARY_STEPS } from './constants';
import { SalaryBreakdownFields } from './SalaryBreakdownFields';
import { StandardDeductionOverride } from './StandardDeductionOverride';
import styles from '../IncomeTaxCalculator.module.scss';
interface SalaryTabProps {
  isSalaried: boolean;
  setIsSalaried: (val: boolean) => void;
  grossSalary: string;
  setGrossSalary: (val: string) => void;
  basicSalary: string;
  setBasicSalary: (val: string) => void;
  cityCategory: CityCategory;
  setCityCategory: (val: CityCategory) => void;
  hraReceived: string;
  setHraReceived: (val: string) => void;
  rentPaid: string;
  setRentPaid: (val: string) => void;
  professionalTax: string;
  setProfessionalTax: (val: string) => void;
  exemptAllowances: string;
  setExemptAllowances: (val: string) => void;
  useCustomStdDeduction: boolean;
  setUseCustomStdDeduction: (val: boolean) => void;
  customStdDeduction: string;
  setCustomStdDeduction: (val: string) => void;
  financialYear: FinancialYear;
}
export const SalaryTab: React.FC<SalaryTabProps> = ({
  isSalaried,
  setIsSalaried,
  grossSalary,
  setGrossSalary,
  useCustomStdDeduction,
  setUseCustomStdDeduction,
  customStdDeduction,
  setCustomStdDeduction,
  financialYear,
  ...breakdownProps
}) => {
  return (
    <div>
      <div className={styles.marginBottom1}>
        <label className={`${styles.label} ${styles.checkboxLabel}`}>
          <input
            type="checkbox"
            checked={isSalaried}
            onChange={(e) => setIsSalaried(e.target.checked)}
            className={styles.primaryCheckbox}
          />
          <span>Are you a Salaried Employee? (Eligible for Standard Deduction)</span>
        </label>
      </div>
      {isSalaried && (
        <div>
          <ValuePicker
            title="Annual Gross Salary"
            value={grossSalary}
            onChange={setGrossSalary}
            stepData={SALARY_STEPS}
            min={0}
            max={100000000}
          />
          <SalaryBreakdownFields {...breakdownProps} />
          <StandardDeductionOverride
            useCustomStdDeduction={useCustomStdDeduction}
            setUseCustomStdDeduction={setUseCustomStdDeduction}
            customStdDeduction={customStdDeduction}
            setCustomStdDeduction={setCustomStdDeduction}
            financialYear={financialYear}
          />
        </div>
      )}
    </div>
  );
};
