import React from 'react';
import { RegimeTaxResult } from '../../utilities/incomeTaxCalculations';
import styles from '../IncomeTaxCalculator.module.scss';
interface OldRegimeCardProps {
  regime: RegimeTaxResult;
  isOldWinner: boolean;
  isSalaried: boolean;
  currencySymbol: string;
}
export const OldRegimeCard: React.FC<OldRegimeCardProps> = ({
  regime,
  isOldWinner,
  isSalaried,
  currencySymbol,
}) => {
  return (
    <div className={`${styles.regimeCard} ${isOldWinner ? styles.regimeCardRecommended : ''}`}>
      <div className={styles.regimeHeader}>
        <div>
          <h3 className={styles.regimeTitle}>Old Tax Regime</h3>
          <div className={styles.regimeSub}>With Chapter VI-A Deductions</div>
        </div>
        {isOldWinner && <span className={styles.tagRecommended}>Recommended</span>}
      </div>
      <div className={styles.regimeHeroAmount}>
        {currencySymbol}
        {regime.totalTaxPayable.toLocaleString('en-IN')}
      </div>
      <div className={styles.regimeWords}>
        Effective Tax Rate: {regime.effectiveTaxRate}%
      </div>
      <div className={styles.detailRows}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Gross Total Income</span>
          <span className={styles.detailValue}>
            {currencySymbol}
            {regime.grossTotalIncome.toLocaleString('en-IN')}
          </span>
        </div>
        {isSalaried && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Standard Deduction</span>
            <span className={styles.detailValueNegative}>
              -{currencySymbol}
              {regime.standardDeduction.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        {regime.hraExemption > 0 && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>HRA Exemption (Sec 10(13A))</span>
            <span className={styles.detailValueNegative}>
              -{currencySymbol}
              {regime.hraExemption.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Chapter VI-A Deductions</span>
          <span className={styles.detailValueNegative}>
            -{currencySymbol}
            {regime.totalDeductions.toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Total Taxable Income</span>
          <span className={styles.detailValue}>
            {currencySymbol}
            {regime.taxableIncome.toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Slab Tax</span>
          <span className={styles.detailValue}>
            {currencySymbol}
            {regime.slabTax.toLocaleString('en-IN')}
          </span>
        </div>
        {regime.rebate87A > 0 && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Section 87A Rebate</span>
            <span className={styles.detailValueNegative}>
              -{currencySymbol}
              {regime.rebate87A.toLocaleString('en-IN')}
            </span>
          </div>
        )}
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Health &amp; Education Cess (4%)</span>
          <span className={styles.detailValue}>
            {currencySymbol}
            {regime.cess.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
};
