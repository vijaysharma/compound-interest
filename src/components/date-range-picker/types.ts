import type { PickerChromeProps } from '../value-picker/chrome';
/**
 * One date, a start/end pair, or a year range, in the same joined box
 * `PairedPicker` draws.
 *
 * `startTitle` / `endTitle` label the two sides. The range stays ordered on its
 * own: moving the start past the end drags the end with it, and vice versa.
 */
export interface DateRangePickerProps extends PickerChromeProps {
  variant?: 'paired' | 'stacked-paired';
  startDate?: string | null;
  endDate?: string | null;
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  /** Label over the start field. Also its accessible name. */
  startTitle?: string;
  /** Label over the end field. Ignored when `singleDate` is set. */
  endTitle?: string;
  /** Floor for the start field, as an ISO date. Defaults to unbounded. */
  startMinDate?: string;
  /** `year` swaps both date inputs for year dropdowns fed by `startYearOptions`. */
  dateMode?: 'date' | 'year';
  /** Year options for the start dropdown. Only read when `dateMode="year"`. */
  startYearOptions?: string[];
  /** Year options for the end dropdown; those before the start year are filtered out. */
  endYearOptions?: string[];
  /** Renders a single labelled date field instead of a pair. */
  singleDate?: boolean;
}
