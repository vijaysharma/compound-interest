import React from 'react';
import { FinancialYear } from '../../utilities/incomeTaxCalculations';
import styles from '../IncomeTaxCalculator.module.scss';
interface StandardDeductionOverrideProps {
  useCustomStdDeduction: boolean;
  setUseCustomStdDeduction: (val: boolean) => void;
  customStdDeduction: string;
  setCustomStdDeduction: (val: string) => void;
  financialYear: FinancialYear;
}
export const StandardDeductionOverride: React.FC<StandardDeductionOverrideProps> = ({
  useCustomStdDeduction,
  setUseCustomStdDeduction,
  customStdDeduction,
  setCustomStdDeduction,
  financialYear,
}) => {
  return (
    <div className={styles.stdOverrideBox}>
      <label className={styles.checkboxToggle}>
        <input
          type="checkbox"
          checked={useCustomStdDeduction}
          onChange={(e) => setUseCustomStdDeduction(e.target.checked)}
          className={styles.primaryCheckbox}
        />
        <span>
          Override Standard Deduction (Default:{' '}
          {financialYear === '2023-24' ? '₹50,000' : '₹75,000'} New / ₹50,000 Old)
        </span>
      </label>
      <p className={styles.stdOverrideDesc}>
        Under Section 16(ia), salaried individuals receive a flat standard deduction without
        submitting expense bills. Under Union Budget rules, this is automatically set to{' '}
        {financialYear === '2023-24' ? '₹50,000' : '₹75,000'} for the New Tax Regime (FY{' '}
        {financialYear}) and ₹50,000 for the Old Tax Regime. Enable this checkbox only if your
        employer capped it to your actual salary or you have a specific prorated deduction amount.
      </p>
      {useCustomStdDeduction && (
        <div className={styles.stdOverrideInput}>
          <input
            type="text"
            value={customStdDeduction}
            onChange={(e) => setCustomStdDeduction(e.target.value)}
            placeholder="Custom Standard Deduction Amount"
            className={styles.input}
          />
        </div>
      )}
    </div>
  );
};
