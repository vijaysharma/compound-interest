import React from 'react';
import type { PerformanceMetrics, InvestmentType } from './types';
import { formatINR } from './utils';
import styles from '../MutualFundDetailModal.module.scss';
export interface FundModalStatsGridProps {
  performance: PerformanceMetrics;
  investmentType: InvestmentType;
  holdingDays: number;
  holdingYears: number;
}
export const FundModalStatsGrid: React.FC<FundModalStatsGridProps> = React.memo(
  ({ performance, investmentType, holdingDays, holdingYears }) => (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>
          {investmentType === 'sip' ? 'Total Invested (SIP)' : 'Invested Capital'}
        </span>
        <span className={styles.statValue}>{formatINR(performance.invested)}</span>
        <span className={styles.statSubtext}>Start NAV: ₹{performance.startNavVal.toFixed(2)}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Pre-Tax Maturity</span>
        <span className={styles.statValue}>{formatINR(performance.maturity)}</span>
        <span className={styles.statSubtext}>End NAV: ₹{performance.endNavVal.toFixed(2)}</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Gross Capital Gain</span>
        <span className={`${styles.statValue} ${performance.gain >= 0 ? styles.statGain : styles.statLoss}`}>
          {performance.gain >= 0 ? '+' : ''}
          {formatINR(performance.gain)}
        </span>
        <span className={styles.statSubtext}>{performance.absReturn.toFixed(1)}% Absolute</span>
      </div>
      <div className={styles.statCard}>
        <span className={styles.statLabel}>Annualized Return</span>
        <span className={`${styles.statValue} ${performance.cagr >= 0 ? styles.statGain : styles.statLoss}`}>
          {performance.cagr.toFixed(2)}%
        </span>
        <span className={styles.statSubtext}>
          {holdingDays} Days (~{holdingYears} Yrs)
        </span>
      </div>
    </div>
  )
);
FundModalStatsGrid.displayName = 'FundModalStatsGrid';
