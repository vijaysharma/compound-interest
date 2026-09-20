import React from 'react';
import { FiLayers } from 'react-icons/fi';
import { StrategySummary } from './types';
import styles from './StrategyCalculator.module.scss';
interface StrategyHeaderProps {
  summary: StrategySummary;
}
export const StrategyHeader: React.FC<StrategyHeaderProps> = ({ summary }) => {
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return (
    <header className={styles.header}>
      <div className={styles.badge}>
        <FiLayers className={styles.badgeIcon} />
        Institutional Wealth Architecture &bull; Dynamic SWP &amp; Reinvestment &bull; Live Tax Engine
      </div>
      <h1 className={styles.title}>Multi-Stage Investment &amp; SWP/SIP Strategy Calculator</h1>
      <p className={styles.subtitle}>
        Model complex two-tier capital trajectories: lumpsum deployment across core funds, staged
        SWP redemptions with dynamic step-ups, parallel SIP wealth compounding, and stage-by-stage
        STCG &amp; LTCG tax tracking.
      </p>
      <div className={styles.headerMetricsGrid}>
        <div className={styles.headerMetricCard}>
          <span className={styles.headerMetricLabel}>Source Balance</span>
          <span className={styles.headerMetricValue}>{formatInr(summary.finalSourceBalance)}</span>
        </div>
        <div className={styles.headerMetricCard}>
          <span className={styles.headerMetricLabel}>Gross SWP Withdrawn</span>
          <span className={styles.headerMetricValueHighlight}>{formatInr(summary.totalSwpWithdrawn)}</span>
        </div>
        <div className={styles.headerMetricCard}>
          <span className={styles.headerMetricLabel}>Reinvested in SIP</span>
          <span className={styles.headerMetricValue}>{formatInr(summary.finalSipBalance)}</span>
        </div>
        <div className={styles.headerMetricCard}>
          <span className={styles.headerMetricLabel}>Total Tax Accrued</span>
          <span className={styles.headerMetricValueDanger}>{formatInr(summary.totalTaxPaid)}</span>
        </div>
        <div className={styles.headerMetricCard}>
          <span className={styles.headerMetricLabel}>Combined Net Worth</span>
          <span className={styles.headerMetricValueSuccess}>{formatInr(summary.finalCombinedNetWorth)}</span>
        </div>
      </div>
    </header>
  );
};
