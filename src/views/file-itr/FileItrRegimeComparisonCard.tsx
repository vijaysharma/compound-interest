import React from 'react';
import { FiLayers } from 'react-icons/fi';
import { Form16ExtractedData } from './types';
import { TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
import styles from '../FileItr.module.scss';
interface FileItrRegimeComparisonCardProps {
  formData: Form16ExtractedData;
  taxComparison: TaxComparisonResult;
}
export const FileItrRegimeComparisonCard: React.FC<FileItrRegimeComparisonCardProps> = ({
  formData,
  taxComparison,
}) => {
  const isNewOptimal = taxComparison.recommendedRegime === 'new';
  const isOldOptimal = taxComparison.recommendedRegime === 'old';
  const oldChapterVia = Math.round(
    taxComparison.oldRegime.totalDeductions - 50000 - taxComparison.oldRegime.hraExemption
  );
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            <FiLayers /> Old vs New Regime Comparison
          </h3>
          <p className={styles.cardSub}>
            Compare side-by-side to choose the regime that maximizes your refund.
          </p>
        </div>
      </div>
      <div className={styles.regimeCompareGrid}>
        {/* New Tax Regime */}
        <div
          className={`${styles.regimeCard} ${
            isNewOptimal ? styles.regimeCardRecommended : ''
          }`}
        >
          <span
            className={`${styles.regimeTag} ${
              isNewOptimal ? styles.regimeTagRecommended : ''
            }`}
          >
            New Regime {isNewOptimal ? '★ Optimal Choice' : ''}
          </span>
          <div className={styles.regimeTaxAmount}>
            ₹{Math.round(taxComparison.newRegime.totalTaxPayable).toLocaleString('en-IN')}
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Gross Salary:</span>
            <span className={styles.regimeRowVal}>₹{formData.grossSalary.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Standard Deduction:</span>
            <span className={styles.regimeRowVal}>₹75,000</span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Chapter VI-A Deductions:</span>
            <span className={styles.regimeRowVal}>₹0 (Disallowed)</span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Taxable Income:</span>
            <span className={styles.regimeRowVal}>
              ₹{Math.round(taxComparison.newRegime.taxableIncome).toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Rebate u/s 87A:</span>
            <span className={`${styles.regimeRowVal} ${styles.rowValSuccess}`}>
              -₹{Math.round(taxComparison.newRegime.rebate87A).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        {/* Old Tax Regime */}
        <div
          className={`${styles.regimeCard} ${
            isOldOptimal ? styles.regimeCardRecommended : ''
          }`}
        >
          <span
            className={`${styles.regimeTag} ${
              isOldOptimal ? styles.regimeTagRecommended : ''
            }`}
          >
            Old Regime {isOldOptimal ? '★ Optimal Choice' : ''}
          </span>
          <div className={styles.regimeTaxAmount}>
            ₹{Math.round(taxComparison.oldRegime.totalTaxPayable).toLocaleString('en-IN')}
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Gross Salary:</span>
            <span className={styles.regimeRowVal}>₹{formData.grossSalary.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Standard Deduction:</span>
            <span className={styles.regimeRowVal}>₹50,000</span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>HRA Exemption:</span>
            <span className={styles.regimeRowVal}>
              ₹{Math.round(taxComparison.oldRegime.hraExemption).toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Chapter VI-A (80C, 80D...):</span>
            <span className={styles.regimeRowVal}>
              ₹{oldChapterVia.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.regimeRow}>
            <span className={styles.regimeRowLabel}>Taxable Income:</span>
            <span className={styles.regimeRowVal}>
              ₹{Math.round(taxComparison.oldRegime.taxableIncome).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
