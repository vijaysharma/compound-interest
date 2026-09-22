import type React from 'react';
import type { PairedPickerProps } from '../PairedPicker';
import type { DateRangePickerProps } from '../DateRangePicker';
import type { ValuePickerStep, ValuePickerTab } from '../../data/valuePickerData';
import type { PickerChromeProps } from './chrome';
export type { PickerChromeProps, PickerScale } from './chrome';
export type ValuePickerVariant = 'amount' | 'value' | 'paired' | 'stacked-paired' | 'date-range';
/** Quick-step buttons as the calculators declare them: `value` is the only required field. */
export type ValuePickerStepData = Array<{
  id?: string;
  value: string | number;
  title?: string;
  label?: string;
}>;
export type ValuePickerTabSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/**
 * The single-value variants (`amount` / `value`) — a number behind a symbol
 * badge, with the `C / + / -` cluster and a step grid.
 *
 * The control is always controlled: pass `value` and `onChange` and echo the
 * change back, or the field will not move.
 */
export interface SingleValuePickerProps extends PickerChromeProps {
  value?: string | number;
  /** Receives the new value as a string, already clamped to `min`/`max`. */
  onChange?: (val: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  /** `merged` fuses the title to the top of the card; `default` sits it above as plain text. */
  titleStyle?: 'default' | 'merged';
  /** Tab strip above the input. Pass `[]` (with a `title` set) for no tabs. */
  tabs?: ValuePickerTab[];
  /** Set both this and `onTabChange` to drive the strip; leave unset for internal state. */
  activeTab?: string;
  /** Seeds the internal tab when `activeTab` is not supplied. */
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  tabSize?: ValuePickerTabSize;
  /** Multi-row step grid. Takes precedence over `stepData`. */
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: ValuePickerStepData;
  /** Flattens the steps into one scrollable row instead of wrapping them. */
  singleRow?: boolean;
  /** Badge content. `null` removes the badge; `%` also switches on decimal support. */
  symbol?: string | null;
  symbolPosition?: 'left' | 'right';
  /** `false` drops the badge's filled background, leaving bare glyph. */
  symbolBg?: boolean;
  /** Slots an extra control between the field and the action buttons. */
  endAdornment?: React.ReactNode;
  /** Number-formatting locale. `en-IN` groups in lakhs, `en-US` in thousands. */
  locale?: string;
  min?: number;
  max?: number;
  /** Step for the `+`/`-` buttons and Arrow Up/Down. Defaults to 500, or 0.5 for decimals. */
  defaultStep?: number;
  /** Renders the amount in words below the card. */
  showWords?: boolean;
  /** Forces fractional input. Inferred from a `%` symbol, a rate-ish title, or a fractional value. */
  allowDecimals?: boolean;
}
/**
 * The umbrella props. `variant` picks which shell renders, and the props for
 * the other two shells are ignored:
 *
 * | `variant` | shell | reads |
 * | --- | --- | --- |
 * | `amount` / `value` (default) | `GenericValuePicker` | `SingleValuePickerProps` |
 * | `paired` / `stacked-paired` | `PairedPicker` | the `source*` / `target*` props |
 * | `date-range` | `DateRangePicker` | the `start*` / `end*` props |
 *
 * Every shell reads `PickerChromeProps` (`title`, `scale`, `compact`,
 * `embedded`, `disabled`, `className`).
 */
export interface ValuePickerProps
  extends SingleValuePickerProps,
    Omit<PairedPickerProps, 'variant' | keyof PickerChromeProps>,
    Omit<DateRangePickerProps, 'variant' | keyof PickerChromeProps> {
  variant?: ValuePickerVariant;
}
export interface ValuePickerStateOptions {
  effectiveValue: string | number;
  effectiveOnChange: (val: string) => void;
  supportsDecimals: boolean;
  effectiveDefaultStep: number;
  safeMax: number;
  min?: number;
  locale?: string;
  showWords?: boolean;
  effectiveSymbol?: string | null;
  title?: string;
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: ValuePickerStepData;
  singleRow?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}
