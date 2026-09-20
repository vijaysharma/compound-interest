import React from 'react';
import MutualFundDetailModal, { DetailedFundItem } from '../../components/MutualFundDetailModal';
import MutualFundSelectorModal from '../../components/MutualFundSelectorModal';
import type { useFundSearch } from '../../components/mutual-fund/useFundSearch';
import type { usePinnedFunds } from '../../components/mutual-fund/usePinnedFunds';
export interface SwpModalsProps {
  detailModalFund: DetailedFundItem | null;
  onCloseDetail: () => void;
  isFundSelectorOpen: boolean;
  onCloseSelector: () => void;
  search: ReturnType<typeof useFundSearch>;
  pinned: ReturnType<typeof usePinnedFunds>;
}
export const SwpModals: React.FC<SwpModalsProps> = React.memo(
  ({
    detailModalFund,
    onCloseDetail,
    isFundSelectorOpen,
    onCloseSelector,
    search,
    pinned,
  }) => (
    <>
      <MutualFundDetailModal fund={detailModalFund} onClose={onCloseDetail} />
      <MutualFundSelectorModal
        open={isFundSelectorOpen}
        onClose={onCloseSelector}
        searchKey={search.searchKey}
        setSearchKey={search.setSearchKey}
        selectedType={search.selectedType}
        setSelectedType={search.setSelectedType}
        selectedGrowth={search.selectedGrowth}
        setSelectedGrowth={search.setSelectedGrowth}
        funds={search.mfs}
        pinnedFunds={pinned.pinnedFunds}
        togglePinFund={pinned.togglePinFund}
        loadingSchemeCodes={pinned.loadingSchemeCodes}
      />
    </>
  )
);
SwpModals.displayName = 'SwpModals';
