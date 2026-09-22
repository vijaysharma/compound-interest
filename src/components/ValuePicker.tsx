'use client';
import React from 'react';
import { PairedPicker, type PairedPickerProps } from './PairedPicker';
import { DateRangePicker, type DateRangePickerProps } from './DateRangePicker';
import type { ValuePickerProps, ValuePickerVariant } from './value-picker/types';
import { arePropsEqual } from './value-picker/arePropsEqual';
import { GenericValuePicker } from './value-picker/GenericValuePicker';
export type { ValuePickerProps, ValuePickerVariant };
export type { PickerScale } from './value-picker/chrome';
const BaseValuePicker: React.FC<ValuePickerProps> = (props) => {
  const { variant } = props;
  if (variant === 'date' || variant === 'date-range') {
    // `orientation` is pinned rather than forwarded: `DateRangePicker` defaults
    // to `column` for direct use, but every picker reached through here has
    // always rendered its two date fields side by side, and the prop is not on
    // `ValuePickerProps` for callers to change.
    return (
      <DateRangePicker
        {...(props as unknown as DateRangePickerProps)}
        variant={variant}
        orientation="row"
      />
    );
  }
  if (variant === 'paired' || variant === 'stacked-paired') {
    return <PairedPicker {...(props as unknown as PairedPickerProps)} variant={variant} />;
  }
  return <GenericValuePicker {...props} />;
};
export const ValuePicker = React.memo(BaseValuePicker, arePropsEqual);
export default ValuePicker;
