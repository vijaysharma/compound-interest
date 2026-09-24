import type { StrategySummary } from './libraryStorage';
export interface StrategyLibraryApi {
  strategies: StrategySummary[];
  activeId: string;
  activeName: string;
  isReady: boolean;
  canAdd: boolean;
  canDelete: boolean;
  selectStrategy: (id: string) => void;
  addStrategy: () => void;
  duplicateStrategy: () => void;
  renameStrategy: (name: string) => void;
  deleteStrategy: (id: string) => void;
}
export interface PickerState {
  strategies: StrategySummary[];
  activeId: string;
}
export const EMPTY_PICKER: PickerState = { strategies: [], activeId: '' };
