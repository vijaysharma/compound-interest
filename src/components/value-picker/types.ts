import type React from 'react';
import type { PairedPickerProps } from '../PairedPicker';
import type { DateRangePickerProps } from '../DateRangePicker';
import type { ValuePickerStep, ValuePickerTab } from '../../data/valuePickerData';
export type ValuePickerVariant = 'amount' | 'value' | 'paired' | 'stacked-paired' | 'date-range';
export interface ValuePickerProps
  extends Omit<PairedPickerProps, 'variant'>,
    Omit<DateRangePickerProps, 'variant'> {
  variant?: ValuePickerVariant;
  value?: string | number;
  inputAmount?: string | number;
  onChange?: (val: string) => void;
  setInputAmount?: React.Dispatch<React.SetStateAction<string>> | ((val: string) => void);
  tabs?: ValuePickerTab[];
  typeData?: ValuePickerTab[];
  activeTab?: string;
  type?: string;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  setType?: React.Dispatch<React.SetStateAction<string>> | ((tabId: string) => void);
  title?: string;
  titleStyle?: 'default' | 'merged';
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>;
  singleRow?: boolean;
  stepSizePrefix?: string;
  typeSizePrefix?: string;
  compact?: boolean;
  embedded?: boolean;
  symbol?: string | null;
  currencySymbol?: string | null;
  symbolPosition?: 'left' | 'right';
  symbolBg?: boolean;
  endAdornment?: React.ReactNode;
  locale?: string;
  min?: number;
  max?: number;
  defaultStep?: number;
  showWords?: boolean;
  allowDecimals?: boolean;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  layout?: 'auto' | 'mobile' | 'desktop';
  placeholder?: string;
  tabSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
export const MAX_SAFE_FINANCIAL_VALUE = 1e12;
export const MAX_RAW_INPUT_LENGTH = 16;
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
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>;
  singleRow?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}
