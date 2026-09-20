import React from 'react';
import type { PropertyTaxComparison } from '../../data/propertyTaxData';
import styles from '../PropertyTax.module.scss';
export function RegimeComparisonGrid({ comparison }: { comparison: PropertyTaxComparison }) {
  const currencySymbol = '₹';
  const isOldWinner = comparison.recommendedOption === 'old';
  const isNewWinner = comparison.recommendedOption === 'new';
  return (
    <div className={styles.comparisonGrid}>
      <div
        className={`${styles.regimeCard} ${isOldWinner ? styles.winner : ''} ${
          !comparison.oldRegime.applicable ? styles.disabled : ''
        }`}
      >
        {isOldWinner && <span className={styles.winnerTag}>Recommended</span>}
        <div className={styles.regimeHeader}>
          <div className={styles.regimeTitle}>Old Rule (Indexation)</div>
          <div className={styles.regimeDesc}>20% Tax + 4% Cess with CII Benefit</div>
        </div>
        <div className={`${styles.regimeTaxAmount} ${isOldWinner ? styles.winnerColor : ''}`}>
          {currencySymbol}{comparison.oldRegime.totalTax.toLocaleString('en-IN')}
        </div>
        <div className={styles.regimeRateBadge}>
          Effective Rate: {comparison.oldRegime.applicable ? '20.8%' : 'N/A'}
        </div>
        <div className={styles.regimeBreakdown}>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Indexed Cost:</span>
            <span className={styles.breakdownVal}>
              {currencySymbol}{comparison.oldRegime.totalIndexedCost.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Gross Capital Gain:</span>
            <span className={styles.breakdownVal}>
              {currencySymbol}{comparison.oldRegime.grossGain.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Sec 54/54EC Exempt:</span>
            <span className={styles.breakdownVal}>
              -{currencySymbol}{comparison.oldRegime.exemptions.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Taxable Gain:</span>
            <span className={styles.breakdownVal}>
              {currencySymbol}{comparison.oldRegime.taxableGain.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.netInHandRow}>
            <span>Net In-Hand:</span>
            <span>{currencySymbol}{comparison.oldRegime.netInHand.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
      <div className={`${styles.regimeCard} ${isNewWinner ? styles.winner : ''}`}>
        {isNewWinner && <span className={styles.winnerTag}>Recommended</span>}
        <div className={styles.regimeHeader}>
          <div className={styles.regimeTitle}>New Rule (Flat Rate)</div>
          <div className={styles.regimeDesc}>12.5% Tax + 4% Cess without Indexation</div>
        </div>
        <div className={`${styles.regimeTaxAmount} ${isNewWinner ? styles.winnerColor : ''}`}>
          {currencySymbol}{comparison.newRegime.totalTax.toLocaleString('en-IN')}
        </div>
        <div className={styles.regimeRateBadge}>Effective Rate: 13.0%</div>
        <div className={styles.regimeBreakdown}>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Actual Cost:</span>
            <span className={styles.breakdownVal}>
              {currencySymbol}{comparison.newRegime.actualCost.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Gross Capital Gain:</span>
            <span className={styles.breakdownVal}>
              {currencySymbol}{comparison.newRegime.grossGain.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Sec 54/54EC Exempt:</span>
            <span className={styles.breakdownVal}>
              -{currencySymbol}{comparison.newRegime.exemptions.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.breakdownRow}>
            <span className={styles.breakdownLabel}>Taxable Gain:</span>
            <span className={styles.breakdownVal}>
              {currencySymbol}{comparison.newRegime.taxableGain.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.netInHandRow}>
            <span>Net In-Hand:</span>
            <span>{currencySymbol}{comparison.newRegime.netInHand.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
