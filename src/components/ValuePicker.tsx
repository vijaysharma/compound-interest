'use client';
import React from 'react';
import { PairedPicker, type PairedPickerProps } from './PairedPicker';
import { DateRangePicker, type DateRangePickerProps } from './DateRangePicker';
import type { ValuePickerProps, ValuePickerVariant } from './value-picker/types';
import { arePropsEqual } from './value-picker/arePropsEqual';
import { GenericValuePicker } from './value-picker/GenericValuePicker';
export type { ValuePickerProps, ValuePickerVariant };
const BaseValuePicker: React.FC<ValuePickerProps> = (props) => {
  const { variant } = props;
  if (variant === 'date-range') {
    return <DateRangePicker {...(props as unknown as DateRangePickerProps)} />;
  }
  if (variant === 'paired' || variant === 'stacked-paired') {
    return <PairedPicker {...(props as unknown as PairedPickerProps)} />;
  }
  return <GenericValuePicker {...props} />;
};
export const ValuePicker = React.memo(BaseValuePicker, arePropsEqual);
export default ValuePicker;
