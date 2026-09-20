import { FiPlus, FiTrendingUp } from 'react-icons/fi';
import type { SipFundAnalysis } from './types';
import { SipStatCard } from './SipStatCard';
import styles from '../MutualFundAnalytics.module.scss';
interface SipGridProps {
  pinnedCount: number;
  fundAnalyses: SipFundAnalysis[];
  onSelectFund: (fund: SipFundAnalysis) => void;
  onOpenSelector: () => void;
}
export function SipGrid({
  pinnedCount, fundAnalyses, onSelectFund, onOpenSelector,
}: SipGridProps) {
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
              <SipStatCard fund={fund} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyStateCard}>
          <div className={styles.emptyStateIcon}>
            <FiTrendingUp />
          </div>
          <h3 className={styles.emptyStateTitle}>Select Mutual Funds to Backtest</h3>
          <p className={styles.emptyStateDescription}>
            Compare historical SIP performance, XIRR returns, and compounding growth on live AMFI data.
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
