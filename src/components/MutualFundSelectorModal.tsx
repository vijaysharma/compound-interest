import { useMemo } from 'react';
import JoinedButtonGroup from './JoinedButtonGroup';
import { MFType } from '../types/types';
import styles from './MutualFundSelectorModal.module.scss';
interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
interface MutualFundSelectorModalProps {
  open: boolean;
  onClose: () => void;
  searchKey: string;
  setSearchKey: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedGrowth: string;
  setSelectedGrowth: (value: string) => void;
  funds: MFType[];
  pinnedFunds: PinnedFund[];
  togglePinFund: (fund: MFType) => void;
  loadingSchemeCodes?: Set<string>;
}
const MutualFundSelectorModal = ({
  open,
  onClose,
  searchKey,
  setSearchKey,
  selectedType,
  setSelectedType,
  selectedGrowth,
  setSelectedGrowth,
  funds,
  pinnedFunds,
  togglePinFund,
  loadingSchemeCodes,
}: MutualFundSelectorModalProps) => {
  const pinnedFundMap = useMemo(
    () => new Map(pinnedFunds.map((f) => [f.schemeCode, f])),
    [pinnedFunds]
  );
  if (!open) return null;
  return (
    <div
      className={styles.dialogOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mutual-fund-selector-title"
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close mutual fund selector"
        onClick={onClose}
      />
      <section className={styles.modalContent}>
        <div className={styles.header}>
          <h2 id="mutual-fund-selector-title" className={styles.headerTitle}>
            Select mutual funds
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close"
            onClick={onClose}
          >
            <span aria-hidden="true" className={styles.closeIcon}>
              &times;
            </span>
          </button>
        </div>
        <div className={styles.filterRow}>
          <JoinedButtonGroup
            data={[
              { id: 'direct', title: 'Direct', value: 'Direct' },
              { id: 'regular', title: 'Regular', value: '!Direct' },
            ]}
            selectedValue={selectedType}
            updateSelectedValue={setSelectedType}
            sizePrefix="sm"
          />
          <JoinedButtonGroup
            data={[
              { id: 'growth', title: 'Growth', value: 'Growth' },
              { id: 'dividend', title: 'Dividend', value: 'Dividend' },
              { id: 'idcw', title: 'IDCW', value: 'IDCW' },
            ]}
            selectedValue={selectedGrowth}
            updateSelectedValue={setSelectedGrowth}
            sizePrefix="sm"
          />
        </div>
        <input
          type="text"
          placeholder="Search Mutual Funds..."
          maxLength={80}
          className={styles.searchInput}
          value={searchKey}
          onChange={(event) => setSearchKey(event.target.value.replace(/[.*+?^${}()|[\]\\]/g, '').slice(0, 80))}
          autoFocus
        />
        {pinnedFunds.length > 0 && (
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
                  {isLoading && (
                    <span className={styles.badgeSpinner} />
                  )}
                  <span className={styles.fundBadgeName}>
                    {index + 1}. {fund.schemeName}
                  </span>
                  <span aria-hidden="true">&times;</span>
                </div>
              );
            })}
          </div>
        )}
        <div className={styles.fundsList}>
          {funds.length > 0 ? (
            <>
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
                        style={{ backgroundColor: pinnedFund.color }}
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
            </>
          ) : (
            <p className={styles.loadingMessage}>
              Enter a search term to find mutual funds.
            </p>
          )}
        </div>
        <button type="button" className={styles.doneBtn} onClick={onClose}>
          Done
        </button>
      </section>
    </div>
  );
};
export default MutualFundSelectorModal;
