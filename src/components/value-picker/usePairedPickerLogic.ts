import { useState } from 'react';
import { useValuePickerState } from './useValuePickerState';
import { MAX_SAFE_FINANCIAL_VALUE } from './inputUtils';
import { sanctnum } from '../../utilities/numSanitity';
import { DEFAULT_PAIRED_AMOUNT_STEPS } from '../../data/valuePickerData';
import type { PairedValuePickerProps, Side } from './pairedPickerTypes';
export function usePairedPickerLogic(props: PairedValuePickerProps) {
  const {
    primaryTitle, primaryValue, onPrimaryChange, primaryMin = 0, primaryMax, primaryStepData,
    secondaryTitle, secondaryValue, onSecondaryChange, secondaryMin = 0, secondaryMax, secondaryStepData,
    capSecondaryToPrimary = true, symbol = '₹', locale = 'en-IN', singleRow = true, showWords = false,
    allowDecimals, defaultStep, disabled = false, readOnly = false,
  } = props;
  const [activeSide, setActiveSide] = useState<Side>('primary');
  const primarySteps = primaryStepData ?? DEFAULT_PAIRED_AMOUNT_STEPS;
  const secondarySteps = secondaryStepData ?? primarySteps;
  const supportsDecimals = Boolean(
    allowDecimals || symbol === '%' || !Number.isInteger(primaryValue) ||
    !Number.isInteger(secondaryValue) || primarySteps.some((step) => Number(step.value) % 1 !== 0)
  );
  const effectiveDefaultStep = defaultStep ?? (supportsDecimals ? 0.5 : 500);
  const secondaryCap = capSecondaryToPrimary
    ? Math.min(primaryValue, secondaryMax ?? Number.POSITIVE_INFINITY)
    : secondaryMax;
  const handlePrimaryChange = (next: string) => {
    const value = sanctnum(next, primaryMin, primaryMax);
    onPrimaryChange(value);
    if (capSecondaryToPrimary && secondaryValue > value) onSecondaryChange(value);
  };
  const handleSecondaryChange = (next: string) => {
    onSecondaryChange(sanctnum(next, secondaryMin, secondaryCap));
  };
  const shared = {
    supportsDecimals, effectiveDefaultStep, locale, showWords,
    effectiveSymbol: symbol, singleRow, disabled, readOnly,
  };
  const primaryState = useValuePickerState({
    ...shared,
    effectiveValue: String(primaryValue),
    effectiveOnChange: handlePrimaryChange,
    safeMax: primaryMax ?? MAX_SAFE_FINANCIAL_VALUE,
    min: primaryMin,
    title: primaryTitle,
    stepData: primarySteps,
  });
  const secondaryState = useValuePickerState({
    ...shared,
    effectiveValue: String(secondaryValue),
    effectiveOnChange: handleSecondaryChange,
    safeMax: secondaryCap ?? MAX_SAFE_FINANCIAL_VALUE,
    min: secondaryMin,
    title: secondaryTitle,
    stepData: secondarySteps,
  });
  const isPrimaryActive = activeSide === 'primary';
  const active = isPrimaryActive ? primaryState : secondaryState;
  const activeMin = isPrimaryActive ? primaryMin : secondaryMin;
  const activeTitle = isPrimaryActive ? primaryTitle : secondaryTitle;
  return {
    activeSide, setActiveSide, supportsDecimals, effectiveDefaultStep,
    primaryState, secondaryState, active, activeMin, activeTitle,
  };
}
