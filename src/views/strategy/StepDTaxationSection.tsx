import React from 'react';
import { FiShield, FiPercent, FiTrendingDown, FiCheckCircle } from 'react-icons/fi';
import { StrategySummary, TimelineStage } from './types';
import styles from './StrategyCalculator.module.scss';
interface StepDTaxationSectionProps {
  summary: StrategySummary;
  stages: TimelineStage[];
}
export const StepDTaxationSection: React.FC<StepDTaxationSectionProps> = ({ summary, stages }) => {
  const totalStcg = stages.reduce((acc, s) => acc + s.stcgGains, 0);
  const totalLtcg = stages.reduce((acc, s) => acc + s.ltcgGains, 0);
  const effectiveTaxRate = summary.totalSwpWithdrawn > 0
    ? ((summary.totalTaxPaid / summary.totalSwpWithdrawn) * 100).toFixed(2)
    : '0.00';
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return (
    <section className={styles.stageCard}>
      <div className={styles.stageHeader}>
        <div className={styles.stageNumber}>Step D</div>
        <div className={styles.stageTitleGroup}>
          <h2 className={styles.stageTitle}>Stage-Wise Taxation &amp; Post-Tax Trajectory</h2>
          <span className={styles.stageSubtitle}>Explicit capital gains categorization (STCG vs LTCG) across all phases</span>
        </div>
      </div>
      <div className={styles.taxSummaryGrid}>
        <div className={styles.taxCard}>
          <div className={styles.taxCardHeader}>
            <FiPercent className={styles.taxCardIcon} />
            <span className={styles.taxCardTitle}>Short-Term Gains (STCG)</span>
          </div>
          <div className={styles.taxCardValue}>{formatInr(totalStcg)}</div>
          <span className={styles.taxCardDesc}>Units held &le; 365 days. Taxed at 20% flat rate.</span>
        </div>
        <div className={styles.taxCard}>
          <div className={styles.taxCardHeader}>
            <FiCheckCircle className={styles.taxCardIcon} />
            <span className={styles.taxCardTitle}>Long-Term Gains (LTCG)</span>
          </div>
          <div className={styles.taxCardValue}>{formatInr(totalLtcg)}</div>
          <span className={styles.taxCardDesc}>Units held &gt; 365 days. 12.5% tax over ₹1.25L annual exemption.</span>
        </div>
        <div className={styles.taxCard}>
          <div className={styles.taxCardHeader}>
            <FiTrendingDown className={styles.taxCardIcon} />
            <span className={styles.taxCardTitle}>Total Tax Liability</span>
          </div>
          <div className={styles.taxCardValueDanger}>{formatInr(summary.totalTaxPaid)}</div>
          <span className={styles.taxCardDesc}>Effective tax friction: {effectiveTaxRate}% of total withdrawals.</span>
        </div>
        <div className={styles.taxCard}>
          <div className={styles.taxCardHeader}>
            <FiShield className={styles.taxCardIcon} />
            <span className={styles.taxCardTitle}>Post-Tax Net Cash Received</span>
          </div>
          <div className={styles.taxCardValueSuccess}>{formatInr(summary.netCashflowReceived)}</div>
          <span className={styles.taxCardDesc}>Clean liquidity available for living expenses or parallel SIP.</span>
        </div>
      </div>
      <div className={styles.taxRulesCallout}>
        <div className={styles.calloutTitle}>Indian Capital Gains Tax Compliance Engine</div>
        <p className={styles.calloutText}>
          Every monthly SWP withdrawal uses FIFO unit liquidation. Equity gains under 12 months incur 20% STCG.
          Gains beyond 12 months utilize the annual ₹1,25,000 LTCG exemption before incurring 12.5%.
          Debt mutual funds are taxed at the investor slab rate of 30%.
        </p>
      </div>
    </section>
  );
};
