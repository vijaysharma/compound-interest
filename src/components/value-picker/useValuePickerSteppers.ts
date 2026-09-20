import { useState } from 'react';
import { sanctnum } from '../../utilities/numSanitity';
interface UseValuePickerSteppersOptions {
  effectiveValue: string | number;
  min: number;
  safeMax: number;
  supportsDecimals: boolean;
  locale: string;
  disabled: boolean;
  effectiveDefaultStep: number;
  setLocalInput: (val: string) => void;
  dispatchChange: (val: string, immediate?: boolean) => void;
}
export function useValuePickerSteppers(opts: UseValuePickerSteppersOptions) {
  const {
    effectiveValue,
    min,
    safeMax,
    supportsDecimals,
    locale,
    disabled,
    effectiveDefaultStep,
    setLocalInput,
    dispatchChange,
  } = opts;
  const [operation, setOperation] = useState<'+' | '-'>('+');
  const applyNumericUpdate = (nextVal: number, immediate = true) => {
    let clamped = nextVal;
    if (min !== undefined && clamped < min) clamped = min;
    if (safeMax !== undefined && clamped > safeMax) clamped = safeMax;
    const formatted = clamped === 0 && !supportsDecimals ? '0' : clamped.toLocaleString(locale);
    setLocalInput(formatted);
    dispatchChange(clamped.toString(), immediate);
  };
  const handleStepClick = (stepAmount: number) => {
    if (disabled) return;
    const current = sanctnum(effectiveValue, min, safeMax);
    let next = operation === '+' ? current + stepAmount : Math.max(min, current - stepAmount);
    if (supportsDecimals) next = Math.round((next + Number.EPSILON) * 10000) / 10000;
    applyNumericUpdate(next, true);
  };
  const handleClear = () => {
    if (disabled) return;
    setOperation('+');
    setLocalInput('');
    dispatchChange(min.toString(), true);
  };
  const handlePlusClick = () => {
    if (disabled) return;
    if (operation === '-') setOperation('+');
    else applyNumericUpdate(sanctnum(effectiveValue, min, safeMax) + effectiveDefaultStep, true);
  };
  const handleMinusClick = () => {
    if (disabled) return;
    if (operation === '+') setOperation('-');
    else applyNumericUpdate(Math.max(min, sanctnum(effectiveValue, min, safeMax) - effectiveDefaultStep), true);
  };
  return {
    operation,
    setOperation,
    applyNumericUpdate,
    handleStepClick,
    handleClear,
    handlePlusClick,
    handleMinusClick,
  };
}
