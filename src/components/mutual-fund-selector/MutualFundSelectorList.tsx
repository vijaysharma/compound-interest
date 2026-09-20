import type { MFType } from '../../types/types';
import type { PinnedFund } from './types';
import styles from '../MutualFundSelectorModal.module.scss';
interface MutualFundSelectorListProps {
  funds: MFType[];
  pinnedFunds: PinnedFund[];
  pinnedFundMap: Map<string, PinnedFund>;
  loadingSchemeCodes?: Set<string>;
  togglePinFund: (fund: MFType) => void;
}
export function MutualFundSelectorList({
  funds,
  pinnedFunds,
  pinnedFundMap,
  loadingSchemeCodes,
  togglePinFund,
}: MutualFundSelectorListProps) {
  if (funds.length === 0) {
    return (
      <div className={styles.fundsList}>
        <p className={styles.loadingMessage}>
          Enter a search term to find mutual funds.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.fundsList}>
      {funds.slice(0, 100).map((fund) => {
        const schemeCode = String(fund.value);
        const pinnedFund = pinnedFundMap.get(schemeCode);
        const isPinned = Boolean(pinnedFund);
        const isLoading = Boolean(loadingSchemeCodes?.has(schemeCode));
        return (
          <label
            key={fund.id}
            className={`${styles.fundItem} ${isPinned ? styles.pinned : ''}`}
          >
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isPinned}
              disabled={!isPinned && pinnedFunds.length >= 8}
              onChange={() => void togglePinFund(fund)}
            />
            {isLoading ? (
              <span className={styles.fundSpinner} />
            ) : pinnedFund ? (
              <span
                className={styles.colorDot}
                ref={(el) => {
                  if (el && pinnedFund.color) el.style.backgroundColor = pinnedFund.color;
                }}
                aria-hidden="true"
              />
            ) : null}
            <span className={styles.fundName}>{fund.name}</span>
          </label>
        );
      })}
      {funds.length > 100 && (
        <div className={styles.emptyMessage}>
          Showing top 100 results. Please refine your search.
        </div>
      )}
    </div>
  );
}
