import React, { useState, useId } from 'react';
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
  value: string | number;
  /**
   * Change callback receiving the updated string value
   */
  onChange: (val: string) => void;
  /**
   * Optional tabs for switching modes (e.g., 'One time amount' vs 'Target amount')
   */
  tabs?: ValuePickerTab[];
  /**
   * Active tab identifier (controlled)
   */
  activeTab?: string;
  /**
   * Default active tab identifier (uncontrolled)
   */
  defaultTab?: string;
  /**
   * Tab switch callback
   */
  onTabChange?: (tabId: string) => void;
  /**
   * Title shown above the picker when tabs are not rendered
   */
  title?: string;
  /**
   * Quick-step button rows (2D array). Defaults to the 2 rows from the reference design.
   */
  stepRows?: ValuePickerStep[][];
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
  onChange,
  tabs = DEFAULT_VALUE_PICKER_TABS,
  activeTab: controlledTab,
  defaultTab,
  onTabChange,
  title,
  stepRows = DEFAULT_VALUE_PICKER_ROWS,
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
  // Internal tab state when uncontrolled
  const [internalTab, setInternalTab] = useState<string>(
    controlledTab ?? defaultTab ?? tabs?.[0]?.id ?? ''
  );
  const currentTab = controlledTab !== undefined ? controlledTab : internalTab;
  // Active operation mode: '+' adds quick-steps, '-' subtracts quick-steps
  const [operation, setOperation] = useState<'+' | '-'>('+');
  // Track if input is currently focused for natural numeric editing
  const [isFocused, setIsFocused] = useState(false);
  const [localInput, setLocalInput] = useState('');
  // Sanitize numeric representation
  const numericValue = sanctnum(value, min, max);
  const handleTabClick = (tabId: string) => {
    if (disabled) return;
    if (controlledTab === undefined) {
      setInternalTab(tabId);
    }
    onTabChange?.(tabId);
  };
  const updateNumericValue = (nextVal: number) => {
    let clamped = nextVal;
    if (min !== undefined && clamped < min) clamped = min;
    if (max !== undefined && clamped > max) clamped = max;
    onChange(clamped.toString());
  };
  // Quick addition / subtraction through step buttons
  const handleStepClick = (stepAmount: number) => {
    if (disabled) return;
    const current = sanctnum(value, min, max);
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
      updateNumericValue(sanctnum(value, min, max) + defaultStep);
    }
  };
  // Minus button: switches mode to '-' and decrements by defaultStep if already '-'
  const handleMinusClick = () => {
    if (disabled) return;
    if (operation === '+') {
      setOperation('-');
    } else {
      updateNumericValue(Math.max(min, sanctnum(value, min, max) - defaultStep));
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
      updateNumericValue(sanctnum(value, min, max) + defaultStep);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      updateNumericValue(Math.max(min, sanctnum(value, min, max) - defaultStep));
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
      {/* Optional fallback title if tabs are not used */}
      {(!tabs || tabs.length === 0) && title && <h5 className={styles.title}>{title}</h5>}
      {/* Main card enclosing tabs, input row, and step grid */}
      <div className={styles.card}>
        {/* Top segmented tabs */}
        {tabs && tabs.length > 0 && (
          <div className={styles.tabsHeader} role="tablist" aria-label="Amount type switcher">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`${componentId}-tab-${tab.id}`}
                  aria-selected={isActive}
                  className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
                  onClick={() => handleTabClick(tab.id)}
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
              aria-label={title || tabs?.find((t) => t.id === currentTab)?.title || 'Amount'}
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
        {stepRows && stepRows.length > 0 && (
          <div className={styles.gridContainer}>
            {stepRows.map((row, rowIndex) => (
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
