import React, { useState, useId, useMemo } from 'react';
import styles from './ValuePicker.module.scss';
import convertToWords from '../utilities/currency';
import { sanctnum } from '../utilities/numSanitity';
import {
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
  type ValuePickerStep,
  type ValuePickerTab,
} from '../data/valuePickerData';
export interface ValuePickerProps {
  /**
   * Current value (numeric or numeric string)
   */
  value?: string | number;
  inputAmount?: string | number;
  /**
   * Change callback receiving the updated string value
   */
  onChange?: (val: string) => void;
  setInputAmount?: React.Dispatch<React.SetStateAction<string>> | ((val: string) => void);
  /**
   * Optional tabs for switching modes (e.g., 'One time amount' vs 'Target amount')
   */
  tabs?: ValuePickerTab[];
  typeData?: ValuePickerTab[];
  /**
   * Active tab identifier (controlled)
   */
  activeTab?: string;
  type?: string;
  /**
   * Default active tab identifier (uncontrolled)
   */
  defaultTab?: string;
  /**
   * Tab switch callback
   */
  onTabChange?: (tabId: string) => void;
  setType?: React.Dispatch<React.SetStateAction<string>> | ((tabId: string) => void);
  /**
   * Title shown above the picker
   */
  title?: string;
  /**
   * Quick-step button rows (2D or 1D array). Defaults to the 2 rows from the reference design.
   */
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>;
  /**
   * Size prefix props for backward compatibility
   */
  stepSizePrefix?: string;
  typeSizePrefix?: string;
  compact?: boolean;
  /**
   * Prefix symbol displayed inside the badge (defaults to '₹')
   */
  currencySymbol?: string;
  /**
   * Locale used for number formatting and words (defaults to 'en-IN')
   */
  locale?: string;
  /**
   * Minimum value allowed (defaults to 0)
   */
  min?: number;
  /**
   * Maximum value allowed
   */
  max?: number;
  /**
   * Default step amount when directly pressing + or - (defaults to 500)
   */
  defaultStep?: number;
  /**
   * Whether to display the value in words below the card (defaults to true)
   */
  showWords?: boolean;
  /**
   * Custom className for root container
   */
  className?: string;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Readonly input state
   */
  readOnly?: boolean;
  /**
   * Layout mode: 'auto' adapts via CSS Container Queries, 'mobile' forces mobile styles, 'desktop' forces desktop styles.
   */
  layout?: 'auto' | 'mobile' | 'desktop';
  /**
   * Input placeholder
   */
  placeholder?: string;
}
/**
 * Mobile-first generic ValuePicker component with modular SCSS.
 * Accurately reproduces the visual layout, touch targets, and responsive desktop behavior.
 */
export const ValuePicker: React.FC<ValuePickerProps> = ({
  value,
  inputAmount,
  onChange,
  setInputAmount,
  tabs,
  typeData,
  activeTab: controlledTab,
  type,
  defaultTab,
  onTabChange,
  setType,
  title,
  stepRows,
  stepData,
  currencySymbol = '₹',
  locale = 'en-IN',
  min = 0,
  max,
  defaultStep = 500,
  showWords = true,
  className = '',
  layout = 'auto',
  disabled = false,
  readOnly = false,
  placeholder = '0',
}) => {
  const componentId = useId();
  // Resolve value and onChange from either prop
  const effectiveValue = value !== undefined ? value : inputAmount !== undefined ? inputAmount : '0';
  const effectiveOnChange = onChange || setInputAmount || (() => {});
  // Resolve tabs and active tab
  const providedTabs = tabs !== undefined ? tabs : typeData;
  const resolvedTabs =
    providedTabs !== undefined
      ? providedTabs
      : title
        ? []
        : DEFAULT_VALUE_PICKER_TABS;
  const currentActiveTab = controlledTab !== undefined ? controlledTab : type;
  const effectiveOnTabChange = onTabChange || setType;
  // Internal tab state when uncontrolled
  const [internalTab, setInternalTab] = useState<string>(
    currentActiveTab ?? defaultTab ?? resolvedTabs?.[0]?.id ?? ''
  );
  const currentTab = currentActiveTab !== undefined ? currentActiveTab : internalTab;
  // Active operation mode: '+' adds quick-steps, '-' subtracts quick-steps
  const [operation, setOperation] = useState<'+' | '-'>('+');
  // Track if input is currently focused for natural numeric editing
  const [isFocused, setIsFocused] = useState(false);
  const [localInput, setLocalInput] = useState('');
  // Normalize step rows: handles 2D stepRows, 1D stepRows, or 1D stepData
  const resolvedStepRows = useMemo<ValuePickerStep[][]>(() => {
    if (stepRows && stepRows.length > 0) {
      if (Array.isArray(stepRows[0])) {
        return stepRows as ValuePickerStep[][];
      }
      const flat = stepRows as ValuePickerStep[];
      const mid = Math.ceil(flat.length / 2);
      return [flat.slice(0, mid), flat.slice(mid)];
    }
    if (stepData && stepData.length > 0) {
      const formatted: ValuePickerStep[] = stepData.map((s, idx) => ({
        id: s.id || `step-${idx}`,
        label: s.label || s.title || `${s.value}`,
        value: typeof s.value === 'string' ? parseInt(s.value, 10) || 0 : Number(s.value) || 0,
      }));
      const mid = Math.ceil(formatted.length / 2);
      return [formatted.slice(0, mid), formatted.slice(mid)];
    }
    return DEFAULT_VALUE_PICKER_ROWS;
  }, [stepRows, stepData]);
  // Sanitize numeric representation
  const numericValue = sanctnum(effectiveValue, min, max);
  const handleTabClick = (tabId: string) => {
    if (disabled) return;
    if (currentActiveTab === undefined) {
      setInternalTab(tabId);
    }
    effectiveOnTabChange?.(tabId);
  };
  const updateNumericValue = (nextVal: number) => {
    let clamped = nextVal;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    effectiveOnChange(clamped.toString());
    setLocalInput(clamped.toString());
  };
  // Quick addition / subtraction through step buttons
  const handleStepClick = (stepAmount: number) => {
    if (disabled) return;
    const current = sanctnum(effectiveValue, min, max);
    let next: number;
    if (operation === '+') {
      next = current + stepAmount;
    } else {
      next = Math.max(min, current - stepAmount);
    }
    updateNumericValue(next);
  };
  // Clear button ('C') resets to 0 (or min) and resets mode to '+'
  const handleClear = () => {
    if (disabled) return;
    setOperation('+');
    updateNumericValue(min);
    setLocalInput('');
  };
  // Plus button: switches mode to '+' and increments by defaultStep if already '+'
  const handlePlusClick = () => {
    if (disabled) return;
    if (operation === '-') {
      setOperation('+');
    } else {
      updateNumericValue(sanctnum(effectiveValue, min, max) + defaultStep);
    }
  };
  // Minus button: switches mode to '-' and decrements by defaultStep if already '-'
  const handleMinusClick = () => {
    if (disabled) return;
    if (operation === '+') {
      setOperation('-');
    } else {
      updateNumericValue(Math.max(min, sanctnum(effectiveValue, min, max) - defaultStep));
    }
  };
  // Direct typing handler with comma / digit handling
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    const rawInput = e.target.value.replace(/[^0-9]/g, '');
    setLocalInput(rawInput);
    const parsed = parseInt(rawInput, 10);
    const newVal = Number.isNaN(parsed) ? min : parsed;
    updateNumericValue(newVal);
  };
  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      updateNumericValue(sanctnum(effectiveValue, min, max) + defaultStep);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateNumericValue(Math.max(min, sanctnum(effectiveValue, min, max) - defaultStep));
    } else if (e.key.toLowerCase() === 'c' && e.altKey) {
      e.preventDefault();
      handleClear();
    }
  };
  // Formatted display string: Indian grouping when blurred, raw editing string when focused
  const displayValue = isFocused
    ? localInput
    : numericValue === 0
      ? '0'
      : numericValue.toLocaleString(locale);
  // In-words string
  const wordsText = showWords && numericValue > 0 ? convertToWords(numericValue, locale) : '';
  const layoutClass =
    layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
  return (
    <div className={`${styles.container} ${layoutClass} ${className}`.trim()}>
      {/* Title rendered when title is provided */}
      {title && <h5 className={styles.title}>{title}</h5>}
      {/* Main card enclosing tabs, input row, and step grid */}
      <div className={styles.card}>
        {/* Top segmented tabs */}
        {resolvedTabs && resolvedTabs.length > 0 && (
          <div className={styles.tabsHeader} role="tablist" aria-label="Amount type switcher">
            {resolvedTabs.map((tab) => {
              const tabIdentifier = tab.value !== undefined ? tab.value : tab.id;
              const isActive = currentTab === tabIdentifier || currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${componentId}-tab-${tab.id}`}
                  aria-selected={isActive}
                  className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
                  onClick={() => handleTabClick(tabIdentifier)}
                  disabled={disabled}
                >
                  {tab.title}
                </button>
              );
            })}
          </div>
        )}
        {/* Value Input Row */}
        <div className={styles.inputRow}>
          {/* Currency / Unit Badge */}
          <div className={styles.currencyBadge} aria-hidden="true">
            {currencySymbol}
          </div>
          {/* Value input */}
          <div className={styles.inputWrapper}>
            <input
              id={`${componentId}-input`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={styles.inputField}
              value={displayValue}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              onFocus={() => {
                setIsFocused(true);
                setLocalInput(numericValue === 0 ? '' : numericValue.toString());
              }}
              onBlur={() => setIsFocused(false)}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              aria-label={
                title ||
                resolvedTabs?.find((t) => t.id === currentTab || t.value === currentTab)?.title ||
                'Amount'
              }
            />
          </div>
          {/* Action buttons: Clear ('C'), Plus ('+'), Minus ('-') */}
          <div className={styles.actionsCluster}>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.clearBtn}`}
              onClick={handleClear}
              disabled={disabled || numericValue === min}
              title="Clear amount (C)"
              aria-label="Clear amount"
            >
              C
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.plusBtn} ${operation === '+' ? styles.activeOp : ''}`}
              onClick={handlePlusClick}
              disabled={disabled}
              title={operation === '+' ? `Add ${defaultStep}` : 'Switch to add mode (+)'}
              aria-label="Add amount"
            >
              +
            </button>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.minusBtn} ${operation === '-' ? styles.activeOp : ''}`}
              onClick={handleMinusClick}
              disabled={disabled || numericValue <= 0}
              title={operation === '-' ? `Subtract ${defaultStep}` : 'Switch to subtract mode (-)'}
              aria-label="Subtract amount"
            >
              -
            </button>
          </div>
        </div>
        {/* Quick steps grid */}
        {resolvedStepRows && resolvedStepRows.length > 0 && (
          <div className={styles.gridContainer}>
            {resolvedStepRows.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className={styles.gridRow}>
                {row.map((step, colIndex) => {
                  const isPrimaryRow = rowIndex === 0;
                  const stepSign = operation === '+' ? '+' : '-';
                  const stepTitle = `${stepSign}${currencySymbol}${step.value.toLocaleString(locale)}`;
                  return (
                    <button
                      key={step.id || `step-${rowIndex}-${colIndex}`}
                      type="button"
                      className={`${styles.gridCell} ${
                        isPrimaryRow ? styles.rowPrimary : styles.rowSecondary
                      }`}
                      onClick={() => handleStepClick(step.value)}
                      disabled={disabled || (operation === '-' && numericValue <= min)}
                      title={stepTitle}
                      aria-label={`${operation === '+' ? 'Add' : 'Subtract'} ${step.label} (${currencySymbol}${step.value})`}
                    >
                      {stepSign}
                      {step.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Number in words display */}
      {showWords && wordsText && (
        <div className={styles.wordsDisplay} aria-live="polite">
          {wordsText}
        </div>
      )}
    </div>
  );
};
export default ValuePicker;
