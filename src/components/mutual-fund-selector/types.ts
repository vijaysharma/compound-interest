import type { MFType } from '../../types/types';
export interface PinnedFund {
  schemeCode: string;
  schemeName: string;
  color: string;
}
export interface MutualFundSelectorModalProps {
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
