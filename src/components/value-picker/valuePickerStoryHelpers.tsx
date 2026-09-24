import React, { useState } from 'react';
import ValuePicker from '../ValuePicker';
import type { ValuePickerProps } from './types';
export const Controlled = ({ value: initial = '0', onChange, ...rest }: ValuePickerProps) => {
  const [value, setValue] = useState(String(initial ?? '0'));
  return (
    <ValuePicker
      {...rest}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
};
export const DateControlled = ({ startDate, endDate, ...rest }: ValuePickerProps) => {
  const [start, setStart] = useState(startDate ?? '');
  const [end, setEnd] = useState(endDate ?? '');
  return (
    <ValuePicker
      {...rest}
      startDate={start}
      endDate={end}
      setStartDate={setStart}
      setEndDate={setEnd}
    />
  );
};
export const PairedControlled = ({ sourceValue, targetValue, ...rest }: ValuePickerProps) => {
  const [source, setSource] = useState(sourceValue ?? '');
  const [target, setTarget] = useState(targetValue ?? '');
  return (
    <ValuePicker
      {...rest}
      sourceValue={source}
      targetValue={target}
      onSourceChange={setSource}
      onTargetChange={setTarget}
    />
  );
};
