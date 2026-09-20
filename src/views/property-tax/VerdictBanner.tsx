import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import type { PropertyTaxComparison } from '../../data/propertyTaxData';
import styles from '../PropertyTax.module.scss';
export function VerdictBanner({ comparison }: { comparison: PropertyTaxComparison }) {
  const getVerdictTitle = () => {
    if (comparison.recommendedOption === 'old') {
      return `Old Rule Wins! Save ₹${comparison.taxSavings.toLocaleString('en-IN')}`;
    }
    if (comparison.recommendedOption === 'new') {
      return comparison.taxSavings > 0
        ? `New Rule Wins! Save ₹${comparison.taxSavings.toLocaleString('en-IN')}`
        : 'New Rule Applies (12.5%)';
    }
    return 'Short-Term Capital Gains (STCG)';
  };
  return (
    <div className={styles.verdictBanner}>
      <FiCheckCircle className={styles.verdictIcon} />
      <div className={styles.verdictContent}>
        <div className={styles.verdictTitle}>{getVerdictTitle()}</div>
        <div className={styles.verdictText}>{comparison.summaryNote}</div>
      </div>
    </div>
  );
}
