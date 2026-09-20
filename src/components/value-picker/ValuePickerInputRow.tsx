import React from 'react';
import { ValuePickerActions } from './ValuePickerActions';
import styles from '../ValuePicker.module.scss';
export interface ValuePickerInputRowProps {
  componentId: string;
  effectiveSymbol: string | null;
  symbolPosition: 'left' | 'right';
  symbolBg?: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  supportsDecimals: boolean;
  displayValue: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  ariaLabel: string;
  endAdornment?: React.ReactNode;
  operation: '+' | '-';
  numericValue: number;
  min: number;
  effectiveDefaultStep: number;
  onClear: () => void;
  onPlusClick: () => void;
  onMinusClick: () => void;
}
export const ValuePickerInputRow: React.FC<ValuePickerInputRowProps> = React.memo(
  ({
    componentId,
    effectiveSymbol,
    symbolPosition,
    symbolBg,
    inputRef,
    supportsDecimals,
    displayValue,
    placeholder,
    disabled,
    readOnly,
    onFocus,
    onBlur,
    onChange,
    onKeyDown,
    ariaLabel,
    endAdornment,
    operation,
    numericValue,
    min,
    effectiveDefaultStep,
    onClear,
    onPlusClick,
    onMinusClick,
  }) => (
    <div className={styles.inputRow}>
      {effectiveSymbol !== null && symbolPosition === 'left' && (
        <div className={`${styles.symbolBadge} ${symbolBg === false ? styles.noBg : ''}`} aria-hidden="true">
          {effectiveSymbol}
        </div>
      )}
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          id={`${componentId}-input`}
          type="text"
          inputMode={supportsDecimals ? 'decimal' : 'numeric'}
          pattern={supportsDecimals ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
          className={styles.inputField}
          value={displayValue}
          suppressHydrationWarning
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown}
          aria-label={ariaLabel}
        />
      </div>
      {effectiveSymbol !== null && symbolPosition === 'right' && (
        <div className={`${styles.symbolBadge} ${symbolBg === false ? styles.noBg : ''}`} aria-hidden="true">
          {effectiveSymbol}
        </div>
      )}
      {endAdornment && <div className={styles.endAdornment}>{endAdornment}</div>}
      <ValuePickerActions
        operation={operation}
        disabled={disabled}
        numericValue={numericValue}
        min={min}
        effectiveDefaultStep={effectiveDefaultStep}
        onClear={onClear}
        onPlusClick={onPlusClick}
        onMinusClick={onMinusClick}
      />
    </div>
  )
);
ValuePickerInputRow.displayName = 'ValuePickerInputRow';
