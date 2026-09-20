import React from 'react';
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import { Streamline, StrategySummary } from './types';
import styles from './StrategyCalculator.module.scss';
interface StreamlineComparisonCardProps {
  allStreamlines: Array<{
    streamline: Streamline;
    result: { summary: StrategySummary };
  }>;
  activeId: string;
  onSelectStreamline: (id: string) => void;
}
export const StreamlineComparisonCard: React.FC<StreamlineComparisonCardProps> = ({
  allStreamlines,
  activeId,
  onSelectStreamline,
}) => {
  const maxWealth = Math.max(...allStreamlines.map((s) => s.result.summary.finalCombinedNetWorth));
  const minTax = Math.min(...allStreamlines.map((s) => s.result.summary.totalTaxPaid));
  const maxSwp = Math.max(...allStreamlines.map((s) => s.result.summary.totalSwpWithdrawn));
  return (
    <div className={styles.comparisonEngineCard}>
      <div className={styles.comparisonHeader}>
        <div className={styles.comparisonTitleGroup}>
          <h3 className={styles.comparisonTitle}>Multi-Streamline Comparison Engine</h3>
          <span className={styles.comparisonSubtitle}>
            Side-by-side terminal metrics across {allStreamlines.length} strategy configurations
          </span>
        </div>
      </div>
      <div className={styles.comparisonCardsGrid}>
        {allStreamlines.map((item, idx) => {
          const { streamline, result } = item;
          const { summary } = result;
          const isActive = streamline.id === activeId;
          const isHighestWealth = summary.finalCombinedNetWorth === maxWealth && allStreamlines.length > 1;
          const isLowestTax = summary.totalTaxPaid === minTax && allStreamlines.length > 1;
          const isHighestSwp = summary.totalSwpWithdrawn === maxSwp && allStreamlines.length > 1;
          return (
            <div
              key={streamline.id}
              className={`${styles.streamlineOutcomeCard} ${isActive ? styles.activeOutcomeCard : ''}`}
              onClick={() => onSelectStreamline(streamline.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSelectStreamline(streamline.id);
              }}
            >
              <div className={styles.outcomeHeader}>
                <div className={styles.outcomeTitleGroup}>
                  <span className={styles.streamlineDot} data-index={idx % 3} />
                  <h4 className={styles.outcomeName}>{streamline.name}</h4>
                </div>
                {isActive && (
                  <span className={styles.activeCheckBadge}>
                    <FiCheckCircle />
                    <span>Active</span>
                  </span>
                )}
              </div>
              <div className={styles.outcomeBadgesRow}>
                {isHighestWealth && (
                  <span className={styles.badgeMaxWealth}>
                    <FiAward /> Highest Wealth
                  </span>
                )}
                {isLowestTax && <span className={styles.badgeLowTax}>Lowest Tax</span>}
                {isHighestSwp && <span className={styles.badgeHighSwp}>Max SWP Cashflow</span>}
              </div>
              <div className={styles.outcomeMetricsList}>
                <div className={styles.metricRow}>
                  <span className={styles.mLabel}>Final Net Wealth:</span>
                  <span className={styles.mValWealth}>₹{summary.finalCombinedNetWorth.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.mLabel}>Total SWP Withdrawn:</span>
                  <span className={styles.mVal}>₹{summary.totalSwpWithdrawn.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.mLabel}>Total Tax Across Stages:</span>
                  <span className={styles.mValTax}>₹{summary.totalTaxPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.metricRow}>
                  <span className={styles.mLabel}>Net Post-Tax Cashflow:</span>
                  <span className={styles.mValGreen}>₹{summary.netCashflowReceived.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
