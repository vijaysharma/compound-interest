import React from 'react';
import { TaxComparisonResult } from '../../utilities/incomeTaxCalculations';
import styles from '../IncomeTaxCalculator.module.scss';
interface BreakevenCardProps {
  comparison: TaxComparisonResult;
  currencySymbol: string;
}
export const BreakevenCard: React.FC<BreakevenCardProps> = ({ comparison, currencySymbol }) => {
  const percent = Math.min(
    100,
    Math.round(
      (comparison.currentDeductionsClaimed / (comparison.breakevenDeductions || 1)) * 100
    )
  );
  return (
    <section className={styles.breakevenCard}>
      <div className={styles.section80CHeader}>
        <div>
          <div className={styles.breakevenTitle}>Breakeven Deductions Threshold</div>
          <div className={styles.breakevenSubtitle}>
            You need a minimum of{' '}
            <strong>
              {currencySymbol}
              {comparison.breakevenDeductions.toLocaleString('en-IN')}
            </strong>{' '}
            in total deductions for the Old Regime to be better than the New Regime.
          </div>
        </div>
        <div className={styles.textRight}>
          <div className={styles.claimedLabel}>Currently Claimed</div>
          <div className={styles.claimedValue}>
            {currencySymbol}
            {comparison.currentDeductionsClaimed.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
      <div className={styles.breakevenBar}>
        <div
          className={styles.breakevenFill}
          ref={(el) => {
            if (el) el.style.width = `${percent}%`;
          }}
        />
      </div>
      {comparison.additionalDeductionsNeeded > 0 ? (
        <div className={styles.warningTextSmall}>
          You need {currencySymbol}
          {comparison.additionalDeductionsNeeded.toLocaleString('en-IN')} more in deductions to break
          even with the New Regime.
        </div>
      ) : (
        <div className={styles.successTextSmall}>
          Your deductions exceed the breakeven threshold, making the Old Regime more beneficial!
        </div>
      )}
    </section>
  );
};
