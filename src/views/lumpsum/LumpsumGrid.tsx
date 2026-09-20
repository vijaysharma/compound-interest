import React from 'react';
import type { FundAnalysis } from '../../components/mutual-fund/types';
import { FundStatsCard } from '../../components/mutual-fund/FundStatsCard';
import { LumpsumEmptyState } from '../../components/mutual-fund/LumpsumEmptyState';
import styles from '../MutualFundAnalytics.module.scss';
export interface LumpsumGridProps {
  fundAnalyses: FundAnalysis[];
  pinnedCount: number;
  onSelectFund: (fund: FundAnalysis) => void;
  onOpenSelector: () => void;
}
export const LumpsumGrid: React.FC<LumpsumGridProps> = React.memo(
  ({ fundAnalyses, pinnedCount, onSelectFund, onOpenSelector }) => (
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
              <FundStatsCard
                start={fund.startNav}
                end={fund.endNav}
                matureAmount={fund.matureAmt}
                profitAmount={fund.profitAmt}
                cagr={fund.profit}
                absoluteReturn={fund.absProfit}
                title={fund.schemeName}
                color={fund.color}
              />
            </div>
          ))}
        </div>
      ) : (
        <LumpsumEmptyState onOpenSelector={onOpenSelector} />
      )}
    </div>
  )
);
LumpsumGrid.displayName = 'LumpsumGrid';
