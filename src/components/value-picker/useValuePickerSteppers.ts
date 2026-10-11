import { useState, useRef, useEffect } from 'react';
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
  setPendingOptimisticValue?: (val: number | null) => void;
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
    setPendingOptimisticValue,
  } = opts;
  const [operation, setOperation] = useState<'+' | '-'>('+');
  const baseNumeric = sanctnum(effectiveValue, min, safeMax);
  const currentValRef = useRef<number>(baseNumeric);
  useEffect(() => {
    currentValRef.current = sanctnum(effectiveValue, min, safeMax);
  }, [effectiveValue, min, safeMax]);
  const applyNumericUpdate = (nextVal: number, immediate = false) => {
    let clamped = nextVal;
    if (min !== undefined && clamped < min) clamped = min;
    if (safeMax !== undefined && clamped > safeMax) clamped = safeMax;
    currentValRef.current = clamped;
    const formatted = clamped === 0 && !supportsDecimals ? '0' : clamped.toLocaleString(locale);
    setLocalInput(formatted);
    setPendingOptimisticValue?.(clamped);
    dispatchChange(clamped.toString(), immediate);
  };
  const handleStepClick = (stepAmount: number) => {
    if (disabled) return;
    const current = currentValRef.current;
    let next = operation === '+' ? current + stepAmount : Math.max(min, current - stepAmount);
    if (supportsDecimals) next = Math.round((next + Number.EPSILON) * 10000) / 10000;
    applyNumericUpdate(next, false);
  };
  const handleClear = () => {
    if (disabled) return;
    setOperation('+');
    currentValRef.current = min;
    setLocalInput('');
    setPendingOptimisticValue?.(min);
    dispatchChange(min.toString(), true);
  };
  const handlePlusClick = () => {
    if (disabled) return;
    if (operation === '-') {
      setOperation('+');
    } else {
      applyNumericUpdate(currentValRef.current + effectiveDefaultStep, false);
    }
  };
  const handleMinusClick = () => {
    if (disabled) return;
    if (operation === '+') {
      setOperation('-');
    } else {
      applyNumericUpdate(Math.max(min, currentValRef.current - effectiveDefaultStep), false);
    }
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
