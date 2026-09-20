'use client';
import React from 'react';
import MutualFundSelectorModal from '../../components/MutualFundSelectorModal';
import { useFundSearch } from '../../components/mutual-fund/useFundSearch';
import { getChartSeriesColor } from '../../data/chartColors';
import type { MFType } from '../../types/types';
import type { FundRef } from './types';
interface StrategyFundModalProps {
  open: boolean;
  onClose: () => void;
  selected: FundRef[];
  onToggle: (fund: FundRef) => void;
  /** Offset into the shared chart palette, so Column 2 does not reuse Column 1's colour. */
  colorOffset?: number;
}
/**
 * Thin adapter over the app's existing mutual-fund selector, so Column 1 and
 * Column 2 both pick funds through the same shared modal and search service.
 */
export const StrategyFundModal = ({
  open,
  onClose,
  selected,
  onToggle,
  colorOffset = 0,
}: StrategyFundModalProps) => {
  const search = useFundSearch('Parag Parikh Flexi Cap', open);
  const handleToggle = (fund: MFType) => {
    const schemeCode = String(fund.value);
    const existing = selected.find((entry) => entry.schemeCode === schemeCode);
    onToggle(
      existing ?? {
        schemeCode,
        schemeName: fund.name,
        color: getChartSeriesColor(colorOffset + selected.length),
      }
    );
  };
  return (
    <MutualFundSelectorModal
      open={open}
      onClose={onClose}
      searchKey={search.searchKey}
      setSearchKey={search.setSearchKey}
      selectedType={search.selectedType}
      setSelectedType={search.setSelectedType}
      selectedGrowth={search.selectedGrowth}
      setSelectedGrowth={search.setSelectedGrowth}
      funds={search.mfs}
      pinnedFunds={selected}
      togglePinFund={handleToggle}
    />
  );
};
