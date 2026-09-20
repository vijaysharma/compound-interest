import React from 'react';
import styles from '../CalculatorPage.module.scss';
interface InflationResultsColProps {
  place: string;
  startYear: string;
  endYear: string;
  currencySymbol: string;
  principal: string;
  inflatedAmount: number;
  deflatedAmount: number;
  endYearIsEstimate: boolean;
}
export const InflationResultsCol: React.FC<InflationResultsColProps> = ({
  place,
  startYear,
  endYear,
  currencySymbol,
  principal,
  inflatedAmount,
  deflatedAmount,
  endYearIsEstimate,
}) => {
  const yearsDiff = Math.abs(Number(endYear) - Number(startYear));
  const principalNum = Number(principal) || 1;
  const erosionPct = Math.max(0, Math.round(((Number(principal) - deflatedAmount) / principalNum) * 100));
  return (
    <div className={styles.resultsCol}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <span>Inflation Impact ({place})</span>
          <span className={styles.summarySub}>
            {startYear} &rarr; {endYear} ({yearsDiff} yrs)
          </span>
        </div>
        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Original Value ({startYear})</span>
            <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
              {currencySymbol}
              {Number(principal).toLocaleString()}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Future Cost ({endYear})</span>
            <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
              {currencySymbol}
              {Math.round(inflatedAmount).toLocaleString()}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Retained Power</span>
            <span className={styles.statValue}>
              {currencySymbol}
              {Math.round(deflatedAmount).toLocaleString()}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Value Erosion</span>
            <span className={`${styles.statValue} ${styles.statValueError}`}>
              -{erosionPct}%
            </span>
          </div>
        </div>
        {endYearIsEstimate && (
          <p className={`${styles.footnote} ${styles.marginZero}`}>
            * {endYear} figure for {place} is an IMF projection.
          </p>
        )}
      </div>
    </div>
  );
};
