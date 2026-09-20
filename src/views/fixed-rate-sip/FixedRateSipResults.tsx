import React from 'react';
import DisplayCard from '../../components/DisplayCard';
import { RT } from '../../types/types';
import styles from '../CalculatorPage.module.scss';
interface FixedRateSipResultsProps {
  payoutAmount: number;
  invType: string;
  rt: RT;
  totalInvested: number;
  estimatedReturns: number;
  investedPercent: number;
}
export const FixedRateSipResults: React.FC<FixedRateSipResultsProps> = ({
  payoutAmount,
  invType,
  rt,
  totalInvested,
  estimatedReturns,
  investedPercent,
}) => {
  return (
    <div className={styles.resultsCol}>
      <DisplayCard
        primaryAmount={payoutAmount}
        title={invType === 'tgt' ? 'Monthly investment required' : 'Maturity amount'}
      />
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <span>Wealth Breakdown</span>
          <span className={styles.summarySub}>
            {rt.tenure} {rt.tenureFormat === 'y' ? 'Years' : 'Months'} @ {rt.roi}%
          </span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Total Invested</span>
            <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
              ₹{totalInvested.toLocaleString('en-IN')}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Est. Returns</span>
            <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
              +₹{estimatedReturns.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
        <div className={styles.ratioBar}>
          <div
            className={styles.ratioFillInvested}
            ref={(el) => {
              if (el) el.style.width = `${investedPercent}%`;
            }}
          />
          <div
            className={styles.ratioFillReturns}
            ref={(el) => {
              if (el) el.style.width = `${100 - investedPercent}%`;
            }}
          />
        </div>
        <div className={styles.ratioLegend}>
          <span className={styles.ratioLegendItem}>
            <span className={styles.ratioDotInvested} /> Invested ({investedPercent}%)
          </span>
          <span className={styles.ratioLegendItem}>
            <span className={styles.ratioDotReturns} /> Returns ({100 - investedPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
};
