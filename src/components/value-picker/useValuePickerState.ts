import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { sanctnum } from '../../utilities/numSanitity';
import { normalizeStepRows } from './stepUtils';
import { getWordsText } from './inputUtils';
import { ValuePickerStateOptions } from './types';
import { useValuePickerKeyboard } from './useValuePickerKeyboard';
import { useValuePickerSteppers } from './useValuePickerSteppers';
export function useValuePickerState(opts: ValuePickerStateOptions) {
  const {
    effectiveValue,
    effectiveOnChange,
    supportsDecimals,
    effectiveDefaultStep,
    safeMax,
    min = 0,
    locale = 'en-IN',
    showWords = true,
    effectiveSymbol = '₹',
    title,
    stepRows,
    stepData,
    singleRow = false,
    disabled = false,
    readOnly = false,
  } = opts;
  const [isFocused, setIsFocused] = useState(false);
  const [localInput, setLocalInput] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestOnChangeRef = useRef(effectiveOnChange);
  useEffect(() => {
    latestOnChangeRef.current = effectiveOnChange;
  }, [effectiveOnChange]);
  const numericValue = useMemo(() => {
    const parsed = sanctnum(effectiveValue, min, safeMax);
    return Number.isFinite(parsed) ? parsed : min;
  }, [effectiveValue, min, safeMax]);
  const wordsText = useMemo(
    () => getWordsText(numericValue, showWords, effectiveSymbol, supportsDecimals, title, locale),
    [numericValue, showWords, effectiveSymbol, supportsDecimals, title, locale]
  );
  const resolvedStepRows = useMemo(
    () => normalizeStepRows(stepRows, stepData, singleRow),
    [stepRows, stepData, singleRow]
  );
  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && inputRef.current) {
      const pos = Math.max(0, pendingCursorRef.current);
      pendingCursorRef.current = null;
      inputRef.current.setSelectionRange(pos, pos);
    }
  });
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);
  const dispatchChange = useCallback((valStr: string, immediate = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (immediate) {
      React.startTransition(() => {
        latestOnChangeRef.current(valStr);
      });
      return;
    }
    debounceTimerRef.current = setTimeout(() => {
      React.startTransition(() => {
        latestOnChangeRef.current(valStr);
      });
    }, 100);
  }, []);
  const {
    operation,
    applyNumericUpdate,
    handleStepClick,
    handleClear,
    handlePlusClick,
    handleMinusClick,
  } = useValuePickerSteppers({
    effectiveValue,
    min,
    safeMax,
    supportsDecimals,
    locale,
    disabled,
    effectiveDefaultStep,
    setLocalInput,
    dispatchChange,
  });
  const { handleInputChange, handleKeyDown, handleFocus, handleBlur } = useValuePickerKeyboard({
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
  });
  const displayValue = isFocused
    ? localInput
    : supportsDecimals
      ? String(effectiveValue ?? '0')
      : numericValue === 0
        ? '0'
        : numericValue.toLocaleString(locale);
  return {
    operation,
    inputRef,
    numericValue,
    wordsText,
    resolvedStepRows,
    displayValue,
    handleStepClick,
    handleClear,
    handlePlusClick,
    handleMinusClick,
    handleInputChange,
    handleKeyDown,
    handleFocus,
    handleBlur,
  };
}
