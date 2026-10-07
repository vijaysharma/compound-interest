'use client';
import { useScrollLock } from '../utilities/useScrollLock';
import { MutualFundSelectorPanel } from './mutual-fund-selector/MutualFundSelectorPanel';
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
        <MutualFundSelectorPanel
          searchKey={searchKey}
          setSearchKey={setSearchKey}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedGrowth={selectedGrowth}
          setSelectedGrowth={setSelectedGrowth}
          funds={funds}
          pinnedFunds={pinnedFunds}
          togglePinFund={togglePinFund}
          loadingSchemeCodes={loadingSchemeCodes}
        />
        <button type="button" className={styles.doneBtn} onClick={handleClose}>
          Done
        </button>
      </section>
    </div>
  );
};
export default MutualFundSelectorModal;
