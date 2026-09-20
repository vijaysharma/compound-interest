import React from 'react';
import { sanctnum } from '../../utilities/numSanitity';
import { formatRawInput, MAX_RAW_INPUT_LENGTH } from './inputUtils';
interface UseValuePickerKeyboardOptions {
  disabled: boolean;
  readOnly: boolean;
  min: number;
  safeMax: number;
  effectiveValue: string | number;
  localInput: string;
  setLocalInput: React.Dispatch<React.SetStateAction<string>>;
  effectiveDefaultStep: number;
  supportsDecimals: boolean;
  locale: string;
  numericValue: number;
  pendingCursorRef: React.MutableRefObject<number | null>;
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
  dispatchChange: (val: string, immediate?: boolean) => void;
  applyNumericUpdate: (val: number, immediate?: boolean) => void;
  handleClear: () => void;
}
export function useValuePickerKeyboard(opts: UseValuePickerKeyboardOptions) {
  const {
    disabled,
    readOnly,
    min,
    safeMax,
    effectiveValue,
    localInput,
    setLocalInput,
    effectiveDefaultStep,
    supportsDecimals,
    locale,
    numericValue,
    pendingCursorRef,
    setIsFocused,
    dispatchChange,
    applyNumericUpdate,
    handleClear,
  } = opts;
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    const rawValue = e.target.value;
    if (rawValue.length > MAX_RAW_INPUT_LENGTH + 5) return;
    const cursor = e.target.selectionStart ?? rawValue.length;
    const res = formatRawInput(rawValue, cursor, supportsDecimals, min, safeMax, locale);
    setLocalInput(res.formatted);
    dispatchChange(res.valStr, false);
    if (res.nextCursor !== null) pendingCursorRef.current = res.nextCursor;
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      dispatchChange(sanctnum(localInput || effectiveValue, min, safeMax).toString(), true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      applyNumericUpdate(sanctnum(effectiveValue, min, safeMax) + effectiveDefaultStep, true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      applyNumericUpdate(Math.max(min, sanctnum(effectiveValue, min, safeMax) - effectiveDefaultStep), true);
    } else if (e.key.toLowerCase() === 'c' && e.altKey) {
      e.preventDefault();
      handleClear();
    }
  };
  const handleFocus = () => {
    setIsFocused(true);
    setLocalInput(
      supportsDecimals
        ? effectiveValue === '0' || effectiveValue === 0
          ? ''
          : String(effectiveValue)
        : numericValue === 0
          ? ''
          : numericValue.toLocaleString(locale)
    );
  };
  const handleBlur = () => {
    setIsFocused(false);
    if (localInput === '' || localInput === '.') {
      dispatchChange(min.toString(), true);
      setLocalInput(min === 0 ? '0' : min.toLocaleString(locale));
      return;
    }
    const parsed = supportsDecimals
      ? parseFloat(localInput)
      : parseInt(localInput.replace(/[^0-9]/g, ''), 10);
    const finalVal = Number.isFinite(parsed) ? Math.min(safeMax, Math.max(min, parsed)) : min;
    dispatchChange(finalVal.toString(), true);
    setLocalInput(supportsDecimals ? String(finalVal) : finalVal.toLocaleString(locale));
  };
  return { handleInputChange, handleKeyDown, handleFocus, handleBlur };
}
