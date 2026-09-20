import React from 'react';
import { StageTaxSummary } from './types';
import styles from './StrategyCalculator.module.scss';
interface StageTaxBreakdownProps {
  taxSummary: StageTaxSummary;
}
export const StageTaxBreakdown: React.FC<StageTaxBreakdownProps> = ({ taxSummary }) => {
  const hasWithdrawals = taxSummary.grossWithdrawalOrRealized > 0;
  const gross = taxSummary.grossWithdrawalOrRealized;
  const tax = taxSummary.totalTaxPayable;
  const net = taxSummary.netPostTaxCashFlow;
  const taxPct = gross > 0 ? Math.min(100, Math.round((tax / gross) * 100)) : 0;
  const netPct = gross > 0 ? 100 - taxPct : 100;
  return (
    <div className={styles.stageTaxContainer}>
      <div className={styles.sectionSubhead}>
        <div className={styles.subheadTitleGroup}>
          <span className={styles.subheadTitle}>Stage FIFO Taxation &amp; Cashflow Realization</span>
          <span className={styles.effectiveTaxBadge}>
            Tax Drag: {taxSummary.effectiveTaxRate.toFixed(1)}%
          </span>
        </div>
        <span className={styles.subheadNote}>STCG (20%) &bull; LTCG (12.5% &gt; ₹1.25L Exemption) &bull; Debt (30%)</span>
      </div>
      <div className={styles.taxCardsGrid}>
        <div className={styles.taxMetricCard}>
          <span className={styles.taxMetricLabel}>STCG Gains (&le;1 yr)</span>
          <span className={styles.taxMetricValue}>₹{taxSummary.stcgGains.toLocaleString('en-IN')}</span>
          <span className={styles.taxRateSub}>Tax @ 20%: ₹{taxSummary.stcgTax.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.taxMetricCard}>
          <span className={styles.taxMetricLabel}>LTCG Gains (&gt;1 yr)</span>
          <span className={styles.taxMetricValue}>₹{taxSummary.ltcgGains.toLocaleString('en-IN')}</span>
          <span className={styles.taxRateSub}>Tax @ 12.5%: ₹{taxSummary.ltcgTax.toLocaleString('en-IN')}</span>
        </div>
        <div className={styles.taxMetricCard}>
          <span className={styles.taxMetricLabel}>Total Stage Tax</span>
          <span className={`${styles.taxMetricValue} ${styles.taxLiabilityText}`}>
            ₹{tax.toLocaleString('en-IN')}
          </span>
          <span className={styles.taxRateSub}>{hasWithdrawals ? 'SWP Redemption' : 'Compounding (Deferred)'}</span>
        </div>
        <div className={styles.taxMetricCardHighlight}>
          <span className={styles.taxMetricLabel}>Net Post-Tax Cash Flow</span>
          <span className={styles.taxMetricValueGreen}>₹{net.toLocaleString('en-IN')}</span>
          <span className={styles.taxRateSub}>Pre-Tax: ₹{gross.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div className={styles.taxVisualizerContainer}>
        <div className={styles.gaugeHeader}>
          <span className={styles.gaugeLabel}>Stage Realization Visualizer</span>
          <span className={styles.gaugeLegend}>
            <span className={styles.legendTaxDot} /> Tax ({taxPct}%)
            <span className={styles.legendNetDot} /> Net Proceeds ({netPct}%)
          </span>
        </div>
        <div className={styles.splitGaugeBar}>
          <div className={styles.gaugeTaxSegment} data-tax-level={taxPct > 20 ? 'high' : taxPct > 10 ? 'med' : 'low'} />
          <div className={styles.gaugeNetSegment} />
        </div>
        <div className={styles.gaugeValuesRow}>
          <span>Pre-Tax Value: ₹{gross.toLocaleString('en-IN')}</span>
          <span>Net Retained: ₹{net.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
