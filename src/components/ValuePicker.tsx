'use client';
import React, {
  useState,
  useId,
  useMemo,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import styles from './ValuePicker.module.scss';
import convertToWords from '../utilities/currency';
import { sanctnum } from '../utilities/numSanitity';
import {
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
  type ValuePickerStep,
  type ValuePickerTab,
} from '../data/valuePickerData';
import { PairedPicker, type PairedPickerProps } from './PairedPicker';
import { DateRangePicker, type DateRangePickerProps } from './DateRangePicker';
export type ValuePickerVariant = 'amount' | 'value' | 'paired' | 'stacked-paired' | 'date-range';
export interface ValuePickerProps
  extends Omit<PairedPickerProps, 'variant'>,
    Omit<DateRangePickerProps, 'variant'> {
  /**
   * Component variant to render:
   * - 'amount' | 'value' (default): Generic numeric value picker with quick steps, steppers, and formatters
   * - 'paired' | 'stacked-paired': Dual slot selector for source/target pairs
   * - 'date-range': Start and end date range selector
   */
  variant?: ValuePickerVariant;
  // --- Common / Value Props ---
  value?: string | number;
  inputAmount?: string | number;
  onChange?: (val: string) => void;
  setInputAmount?: React.Dispatch<React.SetStateAction<string>> | ((val: string) => void);
  tabs?: ValuePickerTab[];
  typeData?: ValuePickerTab[];
  activeTab?: string;
  type?: string;
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  setType?: React.Dispatch<React.SetStateAction<string>> | ((tabId: string) => void);
  title?: string;
  /**
   * Controls how the `title` is rendered:
   * - 'default': plain heading text sitting above the card
   * - 'merged': title becomes a solid badge bar fused to the top of the card
   */
  titleStyle?: 'default' | 'merged';
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>;
  singleRow?: boolean;
  stepSizePrefix?: string;
  typeSizePrefix?: string;
  compact?: boolean;
  embedded?: boolean;
  symbol?: string | null;
  /** Backwards compatibility alias for `symbol` */
  currencySymbol?: string | null;
  symbolPosition?: 'left' | 'right';
  symbolBg?: boolean;
  endAdornment?: React.ReactNode;
  locale?: string;
  min?: number;
  max?: number;
  defaultStep?: number;
  showWords?: boolean;
  allowDecimals?: boolean;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  layout?: 'auto' | 'mobile' | 'desktop';
  placeholder?: string;
}
// Maximum safe numeric limit for financial calculations (prevents overflow/DoS)
const MAX_SAFE_FINANCIAL_VALUE = 1e12; // 1 Lakh Crore
const MAX_RAW_INPUT_LENGTH = 16;
/**
 * Normalizes 1D or 2D step definitions into a standard 2D array
 */
function normalizeStepRows(
  stepRows?: ValuePickerStep[][] | ValuePickerStep[],
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>,
  singleRow?: boolean
): ValuePickerStep[][] {
  if (stepRows && stepRows.length > 0) {
    if (Array.isArray(stepRows[0])) {
      const rows = stepRows as ValuePickerStep[][];
      if (singleRow) {
        return [rows.flat()];
      }
      return rows;
    }
    const flat = stepRows as ValuePickerStep[];
    if (singleRow) {
      return [flat];
    }
    const mid = Math.ceil(flat.length / 2);
    return [flat.slice(0, mid), flat.slice(mid)];
  }
  if (stepData && stepData.length > 0) {
    const formatted: ValuePickerStep[] = stepData.map((s, idx) => ({
      id: s.id || `step-${idx}`,
      label: s.label || s.title || `${s.value}`,
      value: typeof s.value === 'string' ? parseFloat(s.value) || 0 : Number(s.value) || 0,
    }));
    if (singleRow) {
      return [formatted];
    }
    const mid = Math.ceil(formatted.length / 2);
    return [formatted.slice(0, mid), formatted.slice(mid)];
  }
  if (singleRow) {
    return [DEFAULT_VALUE_PICKER_ROWS.flat()];
  }
  return DEFAULT_VALUE_PICKER_ROWS;
}
// =============================================================================
// GENERIC VALUE PICKER (Handles amount, rate, tenure, count, currency, % etc.)
// =============================================================================
const GenericValuePicker: React.FC<ValuePickerProps> = React.memo(
  ({
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
    titleStyle = 'merged',
    stepRows,
    stepData,
    singleRow = false,
    symbol = '₹',
    currencySymbol,
    symbolPosition = 'left',
    symbolBg = true,
    endAdornment,
    locale = 'en-IN',
    min = 0,
    max,
    defaultStep,
    showWords = true,
    allowDecimals,
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
    disabled = false,
    readOnly = false,
    placeholder,
  }) => {
    const componentId = useId();
    const effectiveSymbol =
      symbol !== undefined ? symbol : currencySymbol !== undefined ? currencySymbol : '₹';
    const effectiveValue =
      value !== undefined ? value : inputAmount !== undefined ? inputAmount : '0';
    const effectiveOnChange = useMemo(
      () => onChange || setInputAmount || (() => {}),
      [onChange, setInputAmount]
    );
    // Determine if decimals should be permitted (e.g. Rate/ROI, or explicit allowDecimals)
    const supportsDecimals = Boolean(
      allowDecimals ||
      effectiveSymbol === '%' ||
      title?.toLowerCase().includes('rate') ||
      title?.toLowerCase().includes('roi') ||
      (typeof effectiveValue === 'string' && effectiveValue.includes('.')) ||
      (typeof effectiveValue === 'number' && !Number.isInteger(effectiveValue)) ||
      (stepData && stepData.some((s) => Number(s.value) % 1 !== 0))
    );
    const effectiveDefaultStep =
      defaultStep !== undefined ? defaultStep : supportsDecimals ? 0.5 : 500;
    const safeMax = max !== undefined ? max : MAX_SAFE_FINANCIAL_VALUE;
    // Resolve tabs
    const providedTabs = tabs !== undefined ? tabs : typeData;
    const resolvedTabs =
      providedTabs !== undefined ? providedTabs : title ? [] : DEFAULT_VALUE_PICKER_TABS;
    const currentActiveTab = controlledTab !== undefined ? controlledTab : type;
    const effectiveOnTabChange = onTabChange || setType;
    const [internalTab, setInternalTab] = useState<string>(
      currentActiveTab ?? defaultTab ?? resolvedTabs?.[0]?.id ?? ''
    );
    const currentTab = currentActiveTab !== undefined ? currentActiveTab : internalTab;
    const [operation, setOperation] = useState<'+' | '-'>('+');
    const [isFocused, setIsFocused] = useState(false);
    const [localInput, setLocalInput] = useState<string>('');
    // DOM & Cursor synchronization ref
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingCursorRef = useRef<number | null>(null);
    // Debounce timer and stable callback ref for non-blocking updates
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestOnChangeRef = useRef(effectiveOnChange);
    useEffect(() => {
      latestOnChangeRef.current = effectiveOnChange;
    }, [effectiveOnChange]);
    const numericValue = useMemo(() => {
      const parsed = sanctnum(effectiveValue, min, safeMax);
      return Number.isFinite(parsed) ? parsed : min;
    }, [effectiveValue, min, safeMax]);
    // Words display: only show words for Indian Rupee amounts (not for % or tenure)
    const wordsText = useMemo(() => {
      const shouldShowWords =
        showWords &&
        effectiveSymbol === '₹' &&
        !supportsDecimals &&
        !title?.toLowerCase().includes('rate') &&
        !title?.toLowerCase().includes('roi') &&
        !title?.toLowerCase().includes('tenure');
      if (!shouldShowWords || numericValue <= 0 || numericValue > 999999999999) return '';
      try {
        return convertToWords(numericValue, locale);
      } catch {
        return '';
      }
    }, [showWords, effectiveSymbol, supportsDecimals, title, numericValue, locale]);
    // Normalize step rows
    const resolvedStepRows = useMemo(
      () => normalizeStepRows(stepRows, stepData, singleRow),
      [stepRows, stepData, singleRow]
    );
    // Synchronous layout cursor positioning without flickering or jumps
    useLayoutEffect(() => {
      if (pendingCursorRef.current !== null && inputRef.current) {
        const pos = Math.max(0, pendingCursorRef.current);
        pendingCursorRef.current = null;
        inputRef.current.setSelectionRange(pos, pos);
      }
    });
    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);
    // Notify parent with React.startTransition so typing is never blocked
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
    const handleTabClick = (tabId: string) => {
      if (disabled) return;
      if (currentActiveTab === undefined) {
        setInternalTab(tabId);
      }
      effectiveOnTabChange?.(tabId);
    };
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
      let next: number;
      if (operation === '+') {
        next = current + stepAmount;
      } else {
        next = Math.max(min, current - stepAmount);
      }
      if (supportsDecimals) {
        next = Math.round((next + Number.EPSILON) * 10000) / 10000;
      }
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
      if (operation === '-') {
        setOperation('+');
      } else {
        applyNumericUpdate(sanctnum(effectiveValue, min, safeMax) + effectiveDefaultStep, true);
      }
    };
    const handleMinusClick = () => {
      if (disabled) return;
      if (operation === '+') {
        setOperation('-');
      } else {
        applyNumericUpdate(
          Math.max(min, sanctnum(effectiveValue, min, safeMax) - effectiveDefaultStep),
          true
        );
      }
    };
    // Direct input editing with instant local response and cursor preservation
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      const input = e.target;
      const rawValue = input.value;
      // Safe length capping to prevent DoS
      if (rawValue.length > MAX_RAW_INPUT_LENGTH + 5) return;
      const cursor = input.selectionStart ?? rawValue.length;
      if (supportsDecimals) {
        const sanitized = rawValue.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        const cleanDecimalStr =
          parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
        if (cleanDecimalStr === '' || cleanDecimalStr === '.') {
          setLocalInput(cleanDecimalStr);
          dispatchChange(min.toString(), false);
          return;
        }
        const parsed = parseFloat(cleanDecimalStr);
        if (Number.isFinite(parsed) && parsed > safeMax) {
          setLocalInput(String(safeMax));
          dispatchChange(String(safeMax), false);
          return;
        }
        setLocalInput(cleanDecimalStr);
        dispatchChange(cleanDecimalStr, false);
        return;
      }
      // Integer currency handling with Indian delimiters
      const digitsBeforeCursor = rawValue.slice(0, cursor).replace(/[^0-9]/g, '').length;
      const rawDigits = rawValue.replace(/[^0-9]/g, '').slice(0, MAX_RAW_INPUT_LENGTH);
      if (rawDigits === '') {
        setLocalInput('');
        dispatchChange(min.toString(), false);
        return;
      }
      const parsed = parseInt(rawDigits, 10);
      const clampedVal = Number.isNaN(parsed) ? min : Math.min(safeMax, Math.max(min, parsed));
      const formatted = clampedVal.toLocaleString(locale);
      setLocalInput(formatted);
      dispatchChange(clampedVal.toString(), false);
      // Compute exact cursor offset in formatted string
      if (digitsBeforeCursor === 0) {
        pendingCursorRef.current = 0;
      } else {
        let count = 0;
        let newPos = formatted.length;
        for (let i = 0; i < formatted.length; i++) {
          if (/[0-9]/.test(formatted[i])) {
            count++;
            if (count === digitsBeforeCursor) {
              newPos = i + 1;
              break;
            }
          }
        }
        pendingCursorRef.current = newPos;
      }
    };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        const currentVal = sanctnum(localInput || effectiveValue, min, safeMax);
        dispatchChange(currentVal.toString(), true);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        applyNumericUpdate(sanctnum(effectiveValue, min, safeMax) + effectiveDefaultStep, true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        applyNumericUpdate(
          Math.max(min, sanctnum(effectiveValue, min, safeMax) - effectiveDefaultStep),
          true
        );
      } else if (e.key.toLowerCase() === 'c' && e.altKey) {
        e.preventDefault();
        handleClear();
      }
    };
    const handleFocus = () => {
      setIsFocused(true);
      if (supportsDecimals) {
        setLocalInput(effectiveValue === '0' || effectiveValue === 0 ? '' : String(effectiveValue));
      } else {
        setLocalInput(numericValue === 0 ? '' : numericValue.toLocaleString(locale));
      }
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
    const displayValue = isFocused
      ? localInput
      : supportsDecimals
        ? String(effectiveValue ?? '0')
        : numericValue === 0
          ? '0'
          : numericValue.toLocaleString(locale);
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    const isMergedTitle = titleStyle === 'merged' && !!title;
    return (
      <div className={rootContainerClass}>
        {title && !isMergedTitle && <h5 className={styles.title}>{title}</h5>}
        <div className={`${styles.card} ${isMergedTitle ? styles.cardWithMergedTitle : ''}`.trim()}>
          {isMergedTitle && <div className={styles.titleBar}>{title}</div>}
          {resolvedTabs && resolvedTabs.length > 0 && (
            <div className={styles.tabsHeader} role="tablist" aria-label="Value type switcher">
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
          <div className={styles.inputRow}>
            {effectiveSymbol !== null && symbolPosition === 'left' && (
              <div
                className={`${styles.symbolBadge} ${symbolBg === false ? styles.noBg : ''}`}
                aria-hidden="true"
              >
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                aria-label={
                  title ||
                  resolvedTabs?.find((t) => t.id === currentTab || t.value === currentTab)?.title ||
                  'Value'
                }
              />
            </div>
            {effectiveSymbol !== null && symbolPosition === 'right' && (
              <div
                className={`${styles.symbolBadge} ${symbolBg === false ? styles.noBg : ''}`}
                aria-hidden="true"
              >
                {effectiveSymbol}
              </div>
            )}
            {endAdornment && <div className={styles.endAdornment}>{endAdornment}</div>}
            <div className={styles.actionsCluster}>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.clearBtn}`}
                onClick={handleClear}
                disabled={disabled || numericValue === min}
                title="Clear value (C)"
                aria-label="Clear value"
              >
                C
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.plusBtn} ${operation === '+' ? styles.activeOp : ''}`}
                onClick={handlePlusClick}
                disabled={disabled}
                title={operation === '+' ? `Add ${effectiveDefaultStep}` : 'Switch to add mode (+)'}
                aria-label="Add value"
              >
                +
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.minusBtn} ${operation === '-' ? styles.activeOp : ''}`}
                onClick={handleMinusClick}
                disabled={disabled || numericValue <= 0}
                title={
                  operation === '-'
                    ? `Subtract ${effectiveDefaultStep}`
                    : 'Switch to subtract mode (-)'
                }
                aria-label="Subtract value"
              >
                -
              </button>
            </div>
          </div>
          {resolvedStepRows && resolvedStepRows.length > 0 && (
            <div
              className={`${styles.gridContainer} ${singleRow ? styles.singleRowGrid : ''}`.trim()}
            >
              {resolvedStepRows.map((row, rowIndex) => (
                <div key={`row-${rowIndex}`} className={styles.gridRow}>
                  {row.map((step, colIndex) => {
                    const isPrimaryRow = rowIndex === 0;
                    const stepSign = operation === '+' ? '+' : '-';
                    const stepTitle = `${stepSign}${effectiveSymbol || ''}${step.value.toLocaleString(locale)}`;
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
                        aria-label={`${operation === '+' ? 'Add' : 'Subtract'} ${step.label} (${effectiveSymbol || ''}${step.value})`}
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
        {wordsText && (
          <div className={styles.wordsDisplay} aria-live="polite" suppressHydrationWarning>
            {wordsText}
          </div>
        )}
      </div>
    );
  }
);
GenericValuePicker.displayName = 'GenericValuePicker';
// =============================================================================
// Smart Memoization Comparator
// =============================================================================
function arePropsEqual(prev: ValuePickerProps, next: ValuePickerProps): boolean {
  if (prev.variant !== next.variant) return false;
  // Scalar value comparisons
  if (
    prev.value !== next.value ||
    prev.inputAmount !== next.inputAmount ||
    prev.activeTab !== next.activeTab ||
    prev.type !== next.type ||
    prev.defaultTab !== next.defaultTab ||
    prev.title !== next.title ||
    prev.titleStyle !== next.titleStyle ||
    prev.symbol !== next.symbol ||
    prev.currencySymbol !== next.currencySymbol ||
    prev.symbolPosition !== next.symbolPosition ||
    prev.symbolBg !== next.symbolBg ||
    prev.locale !== next.locale ||
    prev.min !== next.min ||
    prev.max !== next.max ||
    prev.defaultStep !== next.defaultStep ||
    prev.showWords !== next.showWords ||
    prev.allowDecimals !== next.allowDecimals ||
    prev.className !== next.className ||
    prev.compact !== next.compact ||
    prev.embedded !== next.embedded ||
    prev.layout !== next.layout ||
    prev.disabled !== next.disabled ||
    prev.readOnly !== next.readOnly ||
    prev.placeholder !== next.placeholder ||
    prev.singleRow !== next.singleRow ||
    prev.sourceBadgeText !== next.sourceBadgeText ||
    prev.targetBadgeText !== next.targetBadgeText ||
    prev.sourceValue !== next.sourceValue ||
    prev.targetValue !== next.targetValue ||
    prev.startDate !== next.startDate ||
    prev.endDate !== next.endDate ||
    prev.startBadgeText !== next.startBadgeText ||
    prev.endBadgeText !== next.endBadgeText
  ) {
    return false;
  }
  // Compare stepRows if reference changed
  if (prev.stepRows !== next.stepRows) {
    if (!prev.stepRows || !next.stepRows) return false;
    if (prev.stepRows.length !== next.stepRows.length) return false;
  }
  // Compare endAdornment
  if (prev.endAdornment !== next.endAdornment) return false;
  if (prev.sourceSlot !== next.sourceSlot || prev.targetSlot !== next.targetSlot) return false;
  // Deep comparison of stepData items if reference changed
  if (prev.stepData !== next.stepData) {
    if (!prev.stepData || !next.stepData) return false;
    if (prev.stepData.length !== next.stepData.length) return false;
    for (let i = 0; i < prev.stepData.length; i++) {
      const a = prev.stepData[i];
      const b = next.stepData[i];
      if (a.id !== b.id || a.value !== b.value || a.label !== b.label || a.title !== b.title) {
        return false;
      }
    }
  }
  // Deep comparison of tabs if reference changed
  if (prev.tabs !== next.tabs) {
    if (!prev.tabs || !next.tabs) return false;
    if (prev.tabs.length !== next.tabs.length) return false;
    for (let i = 0; i < prev.tabs.length; i++) {
      const a = prev.tabs[i];
      const b = next.tabs[i];
      if (a.id !== b.id || a.title !== b.title || a.value !== b.value) return false;
    }
  }
  return true;
}
// =============================================================================
// MAIN COMPONENT EXPORT
// =============================================================================
const BaseValuePicker: React.FC<ValuePickerProps> = (props) => {
  const { variant } = props;
  if (variant === 'date-range') {
    return <DateRangePicker {...(props as unknown as DateRangePickerProps)} />;
  }
  if (variant === 'paired' || variant === 'stacked-paired') {
    return <PairedPicker {...(props as unknown as PairedPickerProps)} />;
  }
  return <GenericValuePicker {...props} />;
};
export const ValuePicker = React.memo(BaseValuePicker, arePropsEqual);
export default ValuePicker;
