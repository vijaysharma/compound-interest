'use client';
import { useMemo } from 'react';
import JoinedButtonGroup from '../JoinedButtonGroup';
import { MutualFundSelectorPinned } from './MutualFundSelectorPinned';
import { MutualFundSelectorList } from './MutualFundSelectorList';
import type { MutualFundSelectorModalProps } from './types';
import styles from '../MutualFundSelectorModal.module.scss';
export type MutualFundSelectorPanelProps = Omit<MutualFundSelectorModalProps, 'open' | 'onClose'> & {
  /** Inside another dialog: the panel sizes to its content instead of filling a modal. */
  inline?: boolean;
};
/**
 * The fund selector's blocks — plan/option filters, search, pinned funds and results. The selector
 * modal wraps them in a dialog; a view that is already in a modal renders them in place.
 */
export function MutualFundSelectorPanel({
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
  inline = false,
}: MutualFundSelectorPanelProps) {
  const pinnedFundMap = useMemo(
    () => new Map(pinnedFunds.map((f) => [f.schemeCode, f])),
    [pinnedFunds]
  );
  return (
    <div className={`${styles.panel} ${inline ? styles.panelInline : ''}`}>
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
    </div>
  );
}
export default MutualFundSelectorPanel;
