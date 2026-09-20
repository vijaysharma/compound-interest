export type DateMode = 'difference' | 'add-subtract';
export const MODE_DATA = [
  { id: 'diff', value: 'difference', title: 'Date Difference' },
  { id: 'add-sub', value: 'add-subtract', title: 'Add / Subtract' },
];
export const ADD_SUB_DATA = [
  { id: 'add', value: 'add', title: 'Add' },
  { id: 'subtract', value: 'subtract', title: 'Subtract' },
];
export const getTodayISO = () => new Date().toISOString().split('T')[0];
export const STORAGE_KEY = 'date_calculator_state';
export interface SavedDateState {
  mode: DateMode;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isInclusive: boolean;
  baseDate: string;
  baseTime: string;
  years: number;
  months: number;
  days: number;
  hours: number;
  addOrSub: 'add' | 'subtract';
  isAddSubInclusive: boolean;
}
export const getDefaultDateState = (today: string): SavedDateState => ({
  mode: 'difference',
  startDate: today,
  startTime: '00:00',
  endDate: today,
  endTime: '00:00',
  isInclusive: false,
  baseDate: today,
  baseTime: '00:00',
  years: 0,
  months: 0,
  days: 0,
  hours: 0,
  addOrSub: 'add',
  isAddSubInclusive: false,
});
export interface DateDiffResult {
  totalDays: number;
  totalHours: number;
  totalWeeks: number;
  remainingDaysAfterWeeks: number;
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
  isInclusive: boolean;
}
