import React, { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCalendar } from 'react-icons/fi';
import { ExecutionStage } from './types';
import { StageGraph } from './StageGraph';
import { StageFundBreakdown } from './StageFundBreakdown';
import { StageTaxBreakdown } from './StageTaxBreakdown';
import styles from './StrategyCalculator.module.scss';
interface StageCardProps {
  stage: ExecutionStage;
  isInitiallyExpanded?: boolean;
}
export const StageCard: React.FC<StageCardProps> = ({ stage, isInitiallyExpanded = true }) => {
  const [isExpanded, setIsExpanded] = useState(isInitiallyExpanded);
  return (
    <article className={styles.stageMatrixCard}>
      <div
        className={styles.stageCardHeader}
        onClick={() => setIsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setIsExpanded((prev) => !prev);
        }}
      >
        <div className={styles.stageHeaderLeft}>
          <div className={styles.stageBadgeRow}>
            <span className={styles.stageBadge}>{stage.badge}</span>
            <span className={styles.stageDatePill}>
              <FiCalendar />
              <span>{stage.date} (Mo {stage.monthIndex})</span>
            </span>
          </div>
          <h3 className={styles.stageCardTitle}>{stage.title}</h3>
          <p className={styles.stageCardDesc}>{stage.description}</p>
        </div>
        <div className={styles.stageHeaderRight}>
          <div className={styles.netWorthHeaderBox}>
            <span className={styles.netWorthLabel}>Portfolio Net Worth</span>
            <span className={styles.netWorthValue}>₹{stage.combinedNetWorth.toLocaleString('en-IN')}</span>
          </div>
          <button
            type="button"
            className={styles.expandCollapseBtn}
            aria-label={isExpanded ? 'Collapse Stage' : 'Expand Stage'}
          >
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className={styles.stageCardBody}>
          <div className={styles.stageQuickStats}>
            <div className={styles.quickStatItem}>
              <span className={styles.statLabel}>Pre-Tax Assets</span>
              <span className={styles.statVal}>₹{stage.preTaxPortfolioValue.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.statLabel}>Cumulative Invested</span>
              <span className={styles.statVal}>₹{stage.cumulativeInvested.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.statLabel}>Cumulative Withdrawn</span>
              <span className={styles.statVal}>₹{stage.cumulativeWithdrawn.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.quickStatItem}>
              <span className={styles.statLabel}>Cumulative Tax Paid</span>
              <span className={styles.statValTax}>₹{stage.cumulativeTaxPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <StageGraph
            trajectoryPoints={stage.trajectoryPoints}
            fundMetrics={stage.fundMetrics}
          />
          <StageFundBreakdown fundMetrics={stage.fundMetrics} />
          <StageTaxBreakdown taxSummary={stage.taxSummary} />
        </div>
      )}
    </article>
  );
};
