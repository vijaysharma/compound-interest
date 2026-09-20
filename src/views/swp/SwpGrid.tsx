import { FiPlus, FiTrendingUp } from 'react-icons/fi';
import type { SwpFundAnalysis } from './types';
import { SwpStatCard } from './SwpStatCard';
import styles from '../MutualFundAnalytics.module.scss';
interface SwpGridProps {
  pinnedCount: number;
  fundAnalyses: SwpFundAnalysis[];
  onSelectFund: (fund: SwpFundAnalysis) => void;
  onOpenSelector: () => void;
}
export function SwpGrid({
  pinnedCount, fundAnalyses, onSelectFund, onOpenSelector,
}: SwpGridProps) {
  return (
    <div className={styles.statsGrid}>
      {pinnedCount > 0 ? (
        <div className={styles.mfDisplayGrid}>
          {fundAnalyses.map((fund) => (
            <div
              key={fund.schemeCode}
              className={styles.mfDisplayItem}
              onClick={() => onSelectFund(fund)}
              role="button"
              tabIndex={0}
              aria-label={`${fund.schemeName} — view detailed tax and performance analysis`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFund(fund);
                }
              }}
            >
              <SwpStatCard fund={fund} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyStateIcon}>
            <FiTrendingUp />
          </div>
          <h3 className={styles.emptyStateTitle}>Select Mutual Funds to Backtest SWP</h3>
          <p className={styles.emptyStateDescription}>
            Compare historical monthly SWP cashflows, remaining portfolio values, and returns on live AMFI data.
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
      )}
    </div>
  );
}
