import React from 'react';
import { FaRupeeSign } from 'react-icons/fa';
import { FiBarChart2, FiArrowUpRight, FiPercent } from 'react-icons/fi';
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
    <div className={styles.investmentResultsSection}>
      <h3 className={styles.investmentResultsHeading}>
        Investment Results (for selected period)
      </h3>
      <div className={styles.investmentResultsGrid}>
        {/* 1. Invested Capital */}
        <div className={styles.metricCard}>
          <div className={styles.metricCardTop}>
            <div className={`${styles.metricIconWrap} ${styles.metricIconBlue}`}>
              <FaRupeeSign className={styles.metricIcon} />
            </div>
            <span className={styles.metricTitle}>
              {investmentType === 'sip' ? 'Total Invested (SIP)' : 'Invested Capital'}
            </span>
          </div>
          <div className={styles.metricValue}>
            {formatINR(performance.invested)}
          </div>
          <div className={styles.metricSubtext}>
            Start NAV: ₹{performance.startNavVal.toFixed(2)}
          </div>
        </div>
        {/* 2. Pre-Tax Maturity */}
        <div className={styles.metricCard}>
          <div className={styles.metricCardTop}>
            <div className={`${styles.metricIconWrap} ${styles.metricIconCyan}`}>
              <FiBarChart2 className={styles.metricIcon} />
            </div>
            <span className={styles.metricTitle}>Pre-Tax Maturity</span>
          </div>
          <div className={styles.metricValue}>
            {formatINR(performance.maturity)}
          </div>
          <div className={styles.metricSubtext}>
            End NAV: ₹{performance.endNavVal.toFixed(2)}
          </div>
        </div>
        {/* 3. Gross Capital Gain */}
        <div className={styles.metricCard}>
          <div className={styles.metricCardTop}>
            <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
              <FiArrowUpRight className={styles.metricIcon} />
            </div>
            <span className={styles.metricTitle}>Gross Capital Gain</span>
          </div>
          <div className={`${styles.metricValue} ${performance.gain >= 0 ? styles.gainPositive : styles.gainNegative}`}>
            {performance.gain >= 0 ? '+' : ''}
            {formatINR(performance.gain)}
          </div>
          <div className={styles.metricSubtext}>
            {performance.absReturn.toFixed(2)}% Absolute
          </div>
        </div>
        {/* 4. Annualized Return */}
        <div className={styles.metricCard}>
          <div className={styles.metricCardTop}>
            <div className={`${styles.metricIconWrap} ${styles.metricIconGreen}`}>
              <FiPercent className={styles.metricIcon} />
            </div>
            <span className={styles.metricTitle}>Annualized Return</span>
          </div>
          <div className={`${styles.metricValue} ${performance.cagr >= 0 ? styles.gainPositive : styles.gainNegative}`}>
            {performance.cagr.toFixed(2)}%
          </div>
          <div className={styles.metricSubtext}>
            {holdingDays} Days (~{holdingYears} Yr{holdingYears > 1 ? 's' : ''})
          </div>
        </div>
      </div>
    </div>
  )
);
FundModalStatsGrid.displayName = 'FundModalStatsGrid';
