'use client';
import { useMemo } from 'react';
import JoinedButtonGroup from './JoinedButtonGroup';
import { useScrollLock } from '../utilities/useScrollLock';
import { MutualFundSelectorPinned } from './mutual-fund-selector/MutualFundSelectorPinned';
import { MutualFundSelectorList } from './mutual-fund-selector/MutualFundSelectorList';
import type { MutualFundSelectorModalProps, PinnedFund } from './mutual-fund-selector/types';
import styles from './MutualFundSelectorModal.module.scss';
export type { MutualFundSelectorModalProps, PinnedFund };
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
  useScrollLock(open);
  const handleClose = () => {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };
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
        onClick={handleClose}
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
            onClick={handleClose}
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
            sizePrefix="xs"
            compact
            className={styles.filterGroup}
          />
          <JoinedButtonGroup
            data={[
              { id: 'growth', title: 'Growth', value: 'Growth' },
              { id: 'dividend', title: 'Dividend', value: 'Dividend' },
              { id: 'idcw', title: 'IDCW', value: 'IDCW' },
            ]}
            selectedValue={selectedGrowth}
            updateSelectedValue={setSelectedGrowth}
            sizePrefix="xs"
            compact
            className={styles.filterGroup}
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
        <MutualFundSelectorPinned
          pinnedFunds={pinnedFunds}
          loadingSchemeCodes={loadingSchemeCodes}
          togglePinFund={togglePinFund}
        />
        <MutualFundSelectorList
          funds={funds}
          pinnedFunds={pinnedFunds}
          pinnedFundMap={pinnedFundMap}
          loadingSchemeCodes={loadingSchemeCodes}
          togglePinFund={togglePinFund}
        />
        <button type="button" className={styles.doneBtn} onClick={handleClose}>
          Done
        </button>
      </section>
    </div>
  );
};
export default MutualFundSelectorModal;
