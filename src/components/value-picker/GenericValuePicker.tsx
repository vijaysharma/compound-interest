import React, { useId, useState, useMemo } from 'react';
import type { ValuePickerProps } from './types';
import { MAX_SAFE_FINANCIAL_VALUE } from './inputUtils';
import { useValuePickerState } from './useValuePickerState';
import { ValuePickerTabs } from './ValuePickerTabs';
import { ValuePickerInputRow } from './ValuePickerInputRow';
import { ValuePickerGrid } from './ValuePickerGrid';
import { DEFAULT_VALUE_PICKER_TABS } from '../../data/valuePickerData';
import styles from '../ValuePicker.module.scss';
export const GenericValuePicker: React.FC<ValuePickerProps> = React.memo((props) => {
  const {
    value, inputAmount, onChange, setInputAmount, tabs, typeData, activeTab: controlledTab,
    type, defaultTab, onTabChange, setType, title, titleStyle = 'merged', stepRows, stepData,
    singleRow = false, symbol, currencySymbol, symbolPosition = 'left', symbolBg = true,
    endAdornment, locale = 'en-IN', min = 0, max, defaultStep, showWords = true, allowDecimals,
    className = '', compact = false, embedded = false, layout = 'auto', disabled = false,
    readOnly = false, placeholder, tabSize = 'md', condensed = false,
  } = props;
  const componentId = useId();
  const effectiveSymbol = symbol !== undefined ? symbol : currencySymbol !== undefined ? currencySymbol : '₹';
  const effectiveValue = value !== undefined ? value : inputAmount !== undefined ? inputAmount : '0';
  const effectiveOnChange = useMemo(() => onChange || setInputAmount || (() => {}), [onChange, setInputAmount]);
  const supportsDecimals = Boolean(
    allowDecimals || effectiveSymbol === '%' || title?.toLowerCase().includes('rate') ||
    title?.toLowerCase().includes('roi') || (typeof effectiveValue === 'string' && effectiveValue.includes('.')) ||
    (typeof effectiveValue === 'number' && !Number.isInteger(effectiveValue)) ||
    (stepData && stepData.some((s) => Number(s.value) % 1 !== 0))
  );
  const effectiveDefaultStep = defaultStep !== undefined ? defaultStep : supportsDecimals ? 0.5 : 500;
  const safeMax = max !== undefined ? max : MAX_SAFE_FINANCIAL_VALUE;
  const providedTabs = tabs !== undefined ? tabs : typeData;
  const resolvedTabs = providedTabs !== undefined ? providedTabs : title ? [] : DEFAULT_VALUE_PICKER_TABS;
  const currentActiveTab = controlledTab !== undefined ? controlledTab : type;
  const effectiveOnTabChange = onTabChange || setType;
  const [internalTab, setInternalTab] = useState<string>(currentActiveTab ?? defaultTab ?? resolvedTabs?.[0]?.id ?? '');
  const currentTab = currentActiveTab !== undefined ? currentActiveTab : internalTab;
  const state = useValuePickerState({
    effectiveValue,
    effectiveOnChange,
    supportsDecimals,
    effectiveDefaultStep,
    safeMax,
    min,
    locale,
    showWords,
    effectiveSymbol,
    title,
    stepRows,
    stepData,
    singleRow,
    disabled,
    readOnly,
  });
  const handleTabClick = (tabId: string) => {
    if (disabled) return;
    if (currentActiveTab === undefined) setInternalTab(tabId);
    effectiveOnTabChange?.(tabId);
  };
  const layoutClass = layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
  const compactClass = compact ? styles.compact : '';
  const embeddedClass = embedded ? styles.embedded : '';
  const tabSizeClass = styles[`tabSize-${tabSize}`] || '';
  const condensedClass = condensed ? styles.condensed : '';
  const rootContainerClass = `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${tabSizeClass} ${condensedClass} ${className}`.trim();
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
          effectiveSymbol={effectiveSymbol}
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
          effectiveSymbol={effectiveSymbol}
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
