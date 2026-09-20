import React from 'react';
import { AgeCategory, FinancialYear, getAssessmentYear } from '../../utilities/incomeTaxCalculations';
import styles from '../IncomeTaxCalculator.module.scss';
interface TaxInputsHeaderProps {
  financialYear: FinancialYear;
  setFinancialYear: (fy: FinancialYear) => void;
  ageCategory: AgeCategory;
  setAgeCategory: (age: AgeCategory) => void;
}
export const TaxInputsHeader: React.FC<TaxInputsHeaderProps> = ({
  financialYear,
  setFinancialYear,
  ageCategory,
  setAgeCategory,
}) => {
  return (
    <div>
      <div>
        <h2 className={styles.cardHeading}>Enter Income Sources &amp; Deductions</h2>
        <p className={`${styles.cardDesc} ${styles.marginZero}`}>
          Adjust details below to see live updates to both tax regimes.
        </p>
      </div>
      <div className={styles.headerControls}>
        <select
          value={financialYear}
          onChange={(e) => setFinancialYear(e.target.value as FinancialYear)}
          className={`${styles.select} ${styles.yearSelect}`}
        >
          <option value="2026-27">FY 2026-27 ({getAssessmentYear('2026-27')})</option>
          <option value="2025-26">FY 2025-26 ({getAssessmentYear('2025-26')})</option>
          <option value="2024-25">FY 2024-25 ({getAssessmentYear('2024-25')})</option>
          <option value="2023-24">FY 2023-24 ({getAssessmentYear('2023-24')})</option>
        </select>
        <select
          value={ageCategory}
          onChange={(e) => setAgeCategory(e.target.value as AgeCategory)}
          className={`${styles.select} ${styles.ageSelect}`}
        >
          <option value="general">&lt;60 Yrs (General)</option>
          <option value="senior">60-79 Yrs (Senior)</option>
          <option value="super_senior">80+ Yrs (Super Senior)</option>
        </select>
      </div>
    </div>
  );
};
