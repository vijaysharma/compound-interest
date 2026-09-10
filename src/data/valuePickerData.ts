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
export interface GridItem {
  id: string;
  title: string;
  value: string | number;
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
// Default steps for Rate of Interest (Screenshot 1)
export const DEFAULT_ROI_STEPS: number[] = [0.01, 0.1, 1];
// Default steps for Tenure (Screenshot 2)
export const DEFAULT_TENURE_DECREMENT_STEPS: number[] = [-10, -1];
export const DEFAULT_TENURE_INCREMENT_STEPS: number[] = [1, 10];
export const DEFAULT_TENURE_UNITS = [
  { id: 'm', label: 'M', title: 'Months' },
  { id: 'y', label: 'Y', title: 'Years' },
];
// Default 3x8 Duration Matrix Rows (Screenshot 5)
export const DEFAULT_DURATION_MATRIX_ROWS: GridItem[][] = [
  [
    { id: 'd-1d', title: '1D', value: '1' },
    { id: 'd-3d', title: '3D', value: '3' },
    { id: 'd-1w', title: '1W', value: '5' },
    { id: 'd-2w', title: '2W', value: '10' },
    { id: 'd-3w', title: '3W', value: '15' },
    { id: 'd-1m', title: '1M', value: '20' },
    { id: 'd-5w', title: '5W', value: '26' },
    { id: 'd-6w', title: '6W', value: '30' },
  ],
  [
    { id: 'd-2m', title: '2M', value: '39' },
    { id: 'd-3m', title: '3M', value: '63' },
    { id: 'd-4m', title: '4M', value: '84' },
    { id: 'd-5m', title: '5M', value: '105' },
    { id: 'd-6m', title: '6M', value: '126' },
    { id: 'd-1y', title: '1Y', value: '243' },
    { id: 'd-1.5y', title: '1.5Y', value: '366' },
    { id: 'd-2y', title: '2Y', value: '485' },
  ],
  [
    { id: 'd-3y', title: '3Y', value: '740' },
    { id: 'd-4y', title: '4Y', value: '985' },
    { id: 'd-5y', title: '5Y', value: '1235' },
    { id: 'd-6y', title: '6Y', value: '1476' },
    { id: 'd-7y', title: '7Y', value: '1725' },
    { id: 'd-10y', title: '10Y', value: '2464' },
    { id: 'd-15y', title: '15Y', value: '3695' },
    { id: 'd-20y', title: '20Y', value: '4928' },
  ],
];
