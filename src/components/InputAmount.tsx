import React from 'react';
import ValuePicker, { type ValuePickerProps } from './ValuePicker';
export const InputAmount: React.FC<ValuePickerProps> = (props) => {
  return <ValuePicker {...props} />;
};
export default InputAmount;
