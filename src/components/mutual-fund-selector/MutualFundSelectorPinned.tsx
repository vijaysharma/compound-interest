import type { MFType } from '../../types/types';
import type { PinnedFund } from './types';
import styles from '../MutualFundSelectorModal.module.scss';
interface MutualFundSelectorPinnedProps {
  pinnedFunds: PinnedFund[];
  loadingSchemeCodes?: Set<string>;
  togglePinFund: (fund: MFType) => void;
}
export function MutualFundSelectorPinned({
  pinnedFunds,
  loadingSchemeCodes,
  togglePinFund,
}: MutualFundSelectorPinnedProps) {
  if (pinnedFunds.length === 0) return null;
  return (
    <div className={styles.pinnedRow} aria-label="Selected mutual funds">
      {pinnedFunds.map((fund, index) => {
        const isLoading = loadingSchemeCodes?.has(fund.schemeCode);
        return (
          <div
            key={fund.schemeCode}
            className={styles.pinnedBadge}
            title={`Remove ${fund.schemeName}`}
            onClick={() =>
              togglePinFund({
                value: Number(fund.schemeCode),
                name: fund.schemeName,
                id: fund.schemeCode,
              })
            }
          >
            {isLoading && <span className={styles.badgeSpinner} />}
            <span className={styles.fundBadgeName}>
              {index + 1}. {fund.schemeName}
            </span>
            <span aria-hidden="true">&times;</span>
          </div>
        );
      })}
    </div>
  );
}
