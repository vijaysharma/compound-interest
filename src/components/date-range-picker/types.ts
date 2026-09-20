import type { NavType } from '../../types/types';
export interface DateRangePickerProps {
  title?: string;
  startDate?: string | null;
  endDate?: string | null;
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  startBadgeText?: string;
  endBadgeText?: string;
  startMinDate?: string;
  dateMode?: 'date' | 'year';
  startOptions?: string[];
  endOptions?: string[];
  startYearOptions?: string[];
  endYearOptions?: string[];
  data?: NavType[];
  navData?: NavType[];
  startTitle?: string;
  endTitle?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  embedded?: boolean;
  singleDate?: boolean;
  layout?: 'auto' | 'mobile' | 'desktop';
  variant?: 'paired' | 'stacked-paired';
}
