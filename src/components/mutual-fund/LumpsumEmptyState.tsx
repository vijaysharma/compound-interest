import React from 'react';
import { FiTrendingUp, FiPlus } from 'react-icons/fi';
import styles from '../../views/MutualFundAnalytics.module.scss';
export interface LumpsumEmptyStateProps {
  onOpenSelector: () => void;
}
export const LumpsumEmptyState: React.FC<LumpsumEmptyStateProps> = React.memo(
  ({ onOpenSelector }) => (
    <div className={styles.emptyStateCard}>
      <div className={styles.emptyStateIcon}>
        <FiTrendingUp />
      </div>
      <h3 className={styles.emptyStateTitle}>Select Mutual Funds to Backtest Lumpsum</h3>
      <p className={styles.emptyStateDescription}>
        Compare historical lumpsum CAGR returns, absolute growth, and tax-efficiency across
        direct and regular funds.
      </p>
      <button
        type="button"
        className={styles.emptyStateBtn}
        onClick={onOpenSelector}
      >
        <FiPlus />
        <span>Add Mutual Fund</span>
      </button>
    </div>
  )
);
LumpsumEmptyState.displayName = 'LumpsumEmptyState';
