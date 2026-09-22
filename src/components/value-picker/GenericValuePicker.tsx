import React, { useId, useState, useMemo } from 'react';
import type { ValuePickerProps } from './types';
import { pickerRootClass } from './chrome';
import { MAX_SAFE_FINANCIAL_VALUE } from './inputUtils';
import { useValuePickerState } from './useValuePickerState';
import { ValuePickerTabs } from './ValuePickerTabs';
import { ValuePickerInputRow } from './ValuePickerInputRow';
import { ValuePickerGrid } from './ValuePickerGrid';
import { DEFAULT_VALUE_PICKER_TABS } from '../../data/valuePickerData';
import styles from '../ValuePicker.module.scss';
const noop = () => {};
export const GenericValuePicker: React.FC<ValuePickerProps> = React.memo((props) => {
  const {
    value = '0', onChange, tabs, activeTab, defaultTab, onTabChange, title,
    titleStyle = 'merged', stepRows, stepData, singleRow = false, symbol = '₹',
    symbolPosition = 'left', symbolBg = true, endAdornment, locale = 'en-IN', min = 0, max,
    defaultStep, showWords = true, allowDecimals, disabled = false, readOnly = false,
    placeholder, tabSize = 'md',
  } = props;
  const componentId = useId();
  const effectiveOnChange = useMemo(() => onChange ?? noop, [onChange]);
  const supportsDecimals = Boolean(
    allowDecimals || symbol === '%' || title?.toLowerCase().includes('rate') ||
    title?.toLowerCase().includes('roi') || (typeof value === 'string' && value.includes('.')) ||
    (typeof value === 'number' && !Number.isInteger(value)) ||
    (stepData && stepData.some((s) => Number(s.value) % 1 !== 0))
  );
  const effectiveDefaultStep = defaultStep !== undefined ? defaultStep : supportsDecimals ? 0.5 : 500;
  const safeMax = max !== undefined ? max : MAX_SAFE_FINANCIAL_VALUE;
  // A `title` on its own means a labelled single field, so the default tab strip
  // only fills in when neither was supplied.
  const resolvedTabs = tabs !== undefined ? tabs : title ? [] : DEFAULT_VALUE_PICKER_TABS;
  const [internalTab, setInternalTab] = useState<string>(activeTab ?? defaultTab ?? resolvedTabs?.[0]?.id ?? '');
  const currentTab = activeTab !== undefined ? activeTab : internalTab;
  const state = useValuePickerState({
    effectiveValue: value,
    effectiveOnChange,
    supportsDecimals,
    effectiveDefaultStep,
    safeMax,
    min,
    locale,
    showWords,
    effectiveSymbol: symbol,
    title,
    stepRows,
    stepData,
    singleRow,
    disabled,
    readOnly,
  });
  const handleTabClick = (tabId: string) => {
    if (disabled) return;
    if (activeTab === undefined) setInternalTab(tabId);
    onTabChange?.(tabId);
  };
  const rootContainerClass = pickerRootClass(styles, props, styles[`tabSize-${tabSize}`]);
  const isMergedTitle = titleStyle === 'merged' && !!title;
  const ariaLabel = title || resolvedTabs?.find((t) => t.id === currentTab || t.value === currentTab)?.title || 'Value';
  return (
    <div className={rootContainerClass}>
      {title && !isMergedTitle && <h5 className={styles.title}>{title}</h5>}
      <div className={`${styles.card} ${isMergedTitle ? styles.cardWithMergedTitle : ''}`.trim()}>
        {isMergedTitle && <div className={styles.titleBar}>{title}</div>}
        <ValuePickerTabs tabs={resolvedTabs} currentTab={currentTab} componentId={componentId} disabled={disabled} onTabClick={handleTabClick} />
        <ValuePickerInputRow
          componentId={componentId}
          effectiveSymbol={symbol}
          symbolPosition={symbolPosition}
          symbolBg={symbolBg}
          inputRef={state.inputRef}
          supportsDecimals={supportsDecimals}
          displayValue={state.displayValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onFocus={state.handleFocus}
          onBlur={state.handleBlur}
          onChange={state.handleInputChange}
          onKeyDown={state.handleKeyDown}
          ariaLabel={ariaLabel}
          endAdornment={endAdornment}
          operation={state.operation}
          numericValue={state.numericValue}
          min={min}
          effectiveDefaultStep={effectiveDefaultStep}
          onClear={state.handleClear}
          onPlusClick={state.handlePlusClick}
          onMinusClick={state.handleMinusClick}
        />
        <ValuePickerGrid
          resolvedStepRows={state.resolvedStepRows}
          singleRow={singleRow}
          operation={state.operation}
          effectiveSymbol={symbol}
          locale={locale}
          disabled={disabled}
          numericValue={state.numericValue}
          min={min}
          onStepClick={state.handleStepClick}
        />
      </div>
      {state.wordsText && (
        <div className={styles.wordsDisplay} aria-live="polite" suppressHydrationWarning>
          {state.wordsText}
        </div>
      )}
    </div>
  );
});
GenericValuePicker.displayName = 'GenericValuePicker';
