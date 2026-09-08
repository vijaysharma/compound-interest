export interface ValuePickerTab {
  id: string;
  title: string;
  value?: string;
}
export interface ValuePickerStep {
  id?: string;
  label: string;
  value: number;
}
export const DEFAULT_VALUE_PICKER_ROWS: ValuePickerStep[][] = [
  [
    { id: 'r1-1', label: '5Cr', value: 50_000_000 },
    { id: 'r1-2', label: '50L', value: 5_000_000 },
    { id: 'r1-3', label: '5L', value: 500_000 },
    { id: 'r1-4', label: '50K', value: 50_000 },
    { id: 'r1-5', label: '500', value: 500 },
  ],
  [
    { id: 'r2-1', label: '5K', value: 5_000 },
    { id: 'r2-2', label: '5L', value: 500_000 },
    { id: 'r2-3', label: '50K', value: 50_000 },
    { id: 'r2-4', label: '500', value: 500 },
    { id: 'r2-5', label: '50', value: 50 },
  ],
];
export const DEFAULT_VALUE_PICKER_TABS: ValuePickerTab[] = [
  { id: 'one-time', title: 'One time amount' },
  { id: 'target', title: 'Target amount' },
];
