import type { PickerChromeProps } from '../value-picker/chrome';
/**
 * One date, a start/end pair, or a year range, in the same joined box
 * `PairedPicker` draws.
 *
 * `startTitle` / `endTitle` label the two sides. The range stays ordered on its
 * own: moving the start past the end drags the end with it, and vice versa.
 */
export interface DateRangePickerProps extends PickerChromeProps {
  /**
   * Which shape to render — the same two values `ValuePicker` takes, so the
   * vocabulary is shared rather than translated at the boundary.
   *
   * - `date` — one labelled field.
   * - `date-range` (default) — a start/end pair in one joined box.
   *
   * This replaced a `singleDate` boolean. It also replaced an inference that
   * fell back to a single field whenever `setEndDate` and `endDate` were both
   * missing, which meant a range with its end handler not yet wired rendered as
   * a single date instead of showing the bug.
   */
  variant?: 'date' | 'date-range';
  /**
   * How a `date-range` stacks its two columns: side by side (`row`) or one
   * above the other (`column`, the default). Maps to `PairedPicker`'s
   * `paired` / `stacked-paired` wrapper.
   *
   * This used to be called `variant`, which collided with `ValuePicker`'s own
   * `variant` — `ValuePicker` forwards its props wholesale, so the shell name
   * (`date-range`) landed in this slot and the `stacked-paired` comparison
   * downstream could never match. Ignored by `date`, which has one column.
   */
  orientation?: 'row' | 'column';
  startDate?: string | null;
  endDate?: string | null;
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  /** Label over the start field. Also its accessible name. */
  startTitle?: string;
  /** Label over the end field. Ignored when `variant="date"`. */
  endTitle?: string;
  /** Floor for the start field, as an ISO date. Defaults to unbounded. */
  startMinDate?: string;
  /**
   * `year` swaps both date inputs for year dropdowns fed by `startYearOptions`.
   *
   * Only meaningful alongside `variant="date-range"`: a year range is a pair by
   * construction and there is no single-year field, so `year` wins over
   * `variant="date"` rather than rendering half a control.
   */
  dateMode?: 'date' | 'year';
  /** Year options for the start dropdown. Only read when `dateMode="year"`. */
  startYearOptions?: string[];
  /** Year options for the end dropdown; those before the start year are filtered out. */
  endYearOptions?: string[];
}
