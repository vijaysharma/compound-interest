import React from 'react';
import { RT } from '../../types/types';
import styles from '../CalculatorPage.module.scss';
interface FixedRateSwpResultsProps {
  t: RT;
  rt: string;
  initialInvested: number;
  approxWithdrawn: number;
  finalCorpus: number;
  lwa: string;
}
export const FixedRateSwpResults: React.FC<FixedRateSwpResultsProps> = ({
  t,
  rt,
  initialInvested,
  approxWithdrawn,
  finalCorpus,
  lwa,
}) => {
  return (
    <div className={styles.resultsCol}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <span>Portfolio Longevity Summary</span>
          <span className={styles.summarySub}>
            {t.tenure} {t.tenureFormat === 'y' ? 'Years' : 'Months'} @ {rt}% ROI
          </span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Initial Investment</span>
            <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
              ₹{initialInvested.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Est. Total Withdrawn</span>
            <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
              ₹{approxWithdrawn.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Remaining Balance</span>
            <span className={styles.statValue}>₹{finalCorpus.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Monthly Payout (Final)</span>
            <span className={styles.statValue}>₹{(parseInt(lwa) || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
