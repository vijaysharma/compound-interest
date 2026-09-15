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
import { getDateAsISO } from '../utilities/utility';
import type { RT, NavType } from '../types/types';
import {
  DEFAULT_VALUE_PICKER_ROWS,
  DEFAULT_VALUE_PICKER_TABS,
  DEFAULT_ROI_STEPS,
  DEFAULT_TENURE_DECREMENT_STEPS,
  DEFAULT_TENURE_INCREMENT_STEPS,
  DEFAULT_TENURE_UNITS,
  DEFAULT_DURATION_MATRIX_ROWS,
  type ValuePickerStep,
  type ValuePickerTab,
  type GridItem,
} from '../data/valuePickerData';
export type ValuePickerVariant =
  | 'amount'
  | 'roi'
  | 'tenure'
  | 'paired'
  | 'stacked-paired'
  | 'date-range'
  | 'grid';
export interface ValuePickerProps {
  /**
   * Component variant to render:
   * - 'amount': Classic currency amount with tabs, badge, and quick step buttons
   * - 'roi': Rate of interest stepper with + / - mode and customizable decimal steps
   * - 'tenure': Tenure duration stepper with decrement, increment, and M/Y units
   * - 'paired': Paired source-target selector bar with purple badges and slots
   * - 'stacked-paired': As 'paired', but the two halves are full-width rows in
   *   one joined box. For slots wider than a single input, such as a stepper.
   * - 'date-range': Start-end date range selector with purple badges and date inputs
   * - 'grid': Multi-row duration matrix grid with purple borders and selection highlight
   */
  variant?: ValuePickerVariant;
  // --- Common / Amount Props ---
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
   * Controls how the `title` is rendered for the 'amount' variant only:
   * - 'default': plain heading text sitting above the card (existing look)
   * - 'merged': title becomes a solid badge bar fused to the top of the card,
   *   uppercase, with no gap between the title and the card below it
   * Has no effect on any other variant.
   */
  titleStyle?: 'default' | 'merged';
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>;
  singleRow?: boolean;
  stepSizePrefix?: string;
  typeSizePrefix?: string;
  compact?: boolean;
  /**
   * Render the control for placement inside a ValuePicker.Paired slot: drops
   * the outer margins, the joined row's own border and radius, and the title,
   * since the paired badge already labels it.
   */
  embedded?: boolean;
  symbol?: string | null;
  /** Backwards compatibility alias for `symbol` */
  currencySymbol?: string | null;
  /**
   * Which side of the input field the `symbol` badge sits on, for the
   * 'amount' variant only. Defaults to 'left' (existing look).
   */
  symbolPosition?: 'left' | 'right';
  /**
   * Extra control rendered to the right of the input field, after the
   * `symbol` badge if one is present there (i.e. always directly
   * after the field + symbol cluster, before the C / + / - actions).
   * Pass any element with its own state and handler already wired up —
   * e.g. a dropdown or radio group to switch between months and years.
   * 'amount' variant only.
   */
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
  // --- Rate of Interest (ROI) Props ---
  roiSteps?: number[];
  rt?: RT;
  setRt?: React.Dispatch<React.SetStateAction<RT>> | ((rt: RT) => void);
  // --- Tenure Props ---
  tenureDecSteps?: number[];
  tenureIncSteps?: number[];
  unit?: 'm' | 'y';
  onUnitChange?: (unit: 'm' | 'y') => void;
  units?: Array<{ id: string; label: string; title?: string }>;
  // --- Paired / Dual Endpoint Props ---
  sourceBadgeText?: string;
  targetBadgeText?: string;
  sourceSlot?: React.ReactNode;
  targetSlot?: React.ReactNode;
  sourceValue?: string;
  targetValue?: string;
  onSourceChange?: (val: string) => void;
  onTargetChange?: (val: string) => void;
  sourceOptions?: Array<{ label: string; value: string }>;
  targetOptions?: Array<{ label: string; value: string }>;
  sourcePlaceholder?: string;
  targetPlaceholder?: string;
  // --- Date Range Props ---
  startDate?: string | null;
  endDate?: string | null;
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  startBadgeText?: string;
  endBadgeText?: string;
  startMinDate?: string;
  dateMode?: 'date' | 'year';
  startOptions?: string[];
  endOptions?: string[];
  startYearOptions?: string[];
  endYearOptions?: string[];
  navData?: NavType[];
  data?: NavType[];
  startTitle?: string;
  endTitle?: string;
  // --- Duration Grid Props ---
  gridRows?: GridItem[][];
  selectedGridId?: string;
  onGridSelect?: (item: GridItem) => void;
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
// VARIANT: Amount (Default, highly responsive and decimal-safe)
// =============================================================================
const AmountPicker: React.FC<ValuePickerProps> = React.memo(
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
    defaultStep = 500,
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
    const effectiveSymbol = symbol !== undefined ? symbol : currencySymbol !== undefined ? currencySymbol : '₹';
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
    // Words display memoized and protected with try-catch
    const wordsText = useMemo(() => {
      if (!showWords || numericValue <= 0 || numericValue > 999999999999) return '';
      try {
        return convertToWords(numericValue, locale);
      } catch {
        return '';
      }
    }, [showWords, numericValue, locale]);
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
    // Notify parent with React.startTransition so typing is never blocked by expensive parent trees
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
        applyNumericUpdate(sanctnum(effectiveValue, min, safeMax) + defaultStep, true);
      }
    };
    const handleMinusClick = () => {
      if (disabled) return;
      if (operation === '+') {
        setOperation('-');
      } else {
        applyNumericUpdate(Math.max(min, sanctnum(effectiveValue, min, safeMax) - defaultStep), true);
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
        // Allow numbers with decimal point
        const sanitized = rawValue.replace(/[^0-9.]/g, '');
        // Allow at most one decimal point
        const parts = sanitized.split('.');
        const cleanDecimalStr = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
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
        // Immediately flush pending changes
        const currentVal = sanctnum(localInput || effectiveValue, min, safeMax);
        dispatchChange(currentVal.toString(), true);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        applyNumericUpdate(sanctnum(effectiveValue, min, safeMax) + defaultStep, true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        applyNumericUpdate(Math.max(min, sanctnum(effectiveValue, min, safeMax) - defaultStep), true);
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
      // Immediately flush and sanitize on blur
      if (localInput === '' || localInput === '.') {
        dispatchChange(min.toString(), true);
        setLocalInput(min === 0 ? '0' : min.toLocaleString(locale));
        return;
      }
      const parsed = supportsDecimals ? parseFloat(localInput) : parseInt(localInput.replace(/[^0-9]/g, ''), 10);
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
                  'Amount'
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
        {showWords && wordsText && (
          <div className={styles.wordsDisplay} aria-live="polite">
            {wordsText}
          </div>
        )}
      </div>
    );
  }
);
AmountPicker.displayName = 'AmountPicker';
// =============================================================================
// VARIANT: ROI (Rate of Interest Stepper)
// =============================================================================
const RoiPicker: React.FC<ValuePickerProps> = React.memo(
  ({
    rt,
    setRt,
    value,
    onChange,
    setInputAmount,
    roiSteps = DEFAULT_ROI_STEPS,
    title,
    min = 0,
    max = 100,
    disabled = false,
    readOnly = false,
    placeholder = '0',
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
  }) => {
    const [roiOp, setRoiOp] = useState<'+' | '-'>('+');
    const effectiveValue = value !== undefined ? value : '0';
    const roiValStr = rt
      ? rt.roi !== undefined && rt.roi !== null
        ? String(rt.roi)
        : '0'
      : String(effectiveValue);
    const updateRoi = useCallback(
      (newRoi: string) => {
        if (rt && setRt) {
          setRt({ ...rt, roi: newRoi });
        } else if (onChange) {
          onChange(newRoi);
        } else if (setInputAmount) {
          setInputAmount(newRoi);
        }
      },
      [rt, setRt, onChange, setInputAmount]
    );
    const handleRoiStep = (stepAmt: number) => {
      if (disabled) return;
      let curr = parseFloat(roiValStr);
      if (!Number.isFinite(curr)) curr = 0;
      if (roiOp === '+') {
        curr += stepAmt;
      } else {
        curr -= stepAmt;
        if (curr <= min) {
          updateRoi(min.toString());
          setRoiOp('+');
          return;
        }
      }
      const clamped = Math.min(max, Math.max(min, curr));
      const rounded = Math.round((clamped + Number.EPSILON) * 100) / 100;
      updateRoi(`${rounded}`);
    };
    const handleRoiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      const iv = e.target.value;
      if (iv === '' || iv === '.') {
        updateRoi(iv);
        return;
      }
      const num = parseFloat(iv);
      if (!Number.isFinite(num)) {
        updateRoi('0');
        return;
      }
      if (num < 0) {
        setRoiOp('+');
        return;
      }
      const clamped = Math.min(max, num);
      updateRoi(iv.length > 5 ? `${clamped}` : iv);
    };
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    return (
      <div className={rootContainerClass}>
        {!embedded && (
          <h5 className={`${styles.title} ${styles.titleCenter}`}>
            {title || 'Rate of Interest (%)'}
          </h5>
        )}
        <div className={styles.joinedRow}>
          {roiSteps.map((step) => (
            <button
              key={`roi-step-${step}`}
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleRoiStep(step)}
              disabled={disabled}
              aria-label={`Change ROI by ${step}%`}
            >
              {step}
            </button>
          ))}
          <div className={styles.joinedInputWrapper}>
            <input
              type="number"
              placeholder={placeholder}
              min={min}
              max={max}
              step="any"
              className={styles.joinedInputField}
              value={roiValStr}
              disabled={disabled}
              readOnly={readOnly}
              onChange={handleRoiInputChange}
              aria-label={title || 'Rate of Interest'}
            />
          </div>
          <button
            type="button"
            className={`${styles.opBtn} ${roiOp === '+' ? styles.activeOp : ''}`}
            onClick={() => setRoiOp('+')}
            disabled={disabled}
            title="Add mode (+)"
            aria-label="Add mode"
          >
            +
          </button>
          <button
            type="button"
            className={`${styles.opBtn} ${roiOp === '-' ? styles.activeOp : ''}`}
            onClick={() => setRoiOp('-')}
            disabled={disabled || roiValStr === '0' || parseFloat(roiValStr) <= 0}
            title="Subtract mode (-)"
            aria-label="Subtract mode"
          >
            -
          </button>
        </div>
      </div>
    );
  }
);
RoiPicker.displayName = 'RoiPicker';
// =============================================================================
// VARIANT: Tenure (Duration Stepper)
// =============================================================================
const TenurePicker: React.FC<ValuePickerProps> = React.memo(
  ({
    rt,
    setRt,
    value,
    onChange,
    setInputAmount,
    tenureDecSteps = DEFAULT_TENURE_DECREMENT_STEPS,
    tenureIncSteps = DEFAULT_TENURE_INCREMENT_STEPS,
    unit,
    onUnitChange,
    units = DEFAULT_TENURE_UNITS,
    title,
    min = 0,
    max = 100,
    disabled = false,
    readOnly = false,
    placeholder = '0',
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
  }) => {
    const effectiveValue = value !== undefined ? value : '0';
    const tenureValStr = rt
      ? rt.tenure !== undefined && rt.tenure !== null
        ? String(rt.tenure)
        : '0'
      : String(effectiveValue);
    const effectiveUnit = rt ? rt.tenureFormat : unit || 'y';
    const updateTenure = useCallback(
      (newTenure: string) => {
        if (rt && setRt) {
          setRt({ ...rt, tenure: newTenure });
        } else if (onChange) {
          onChange(newTenure);
        } else if (setInputAmount) {
          setInputAmount(newTenure);
        }
      },
      [rt, setRt, onChange, setInputAmount]
    );
    const handleTenureStep = (stepDelta: number) => {
      if (disabled) return;
      let curr = parseInt(tenureValStr, 10);
      if (!Number.isFinite(curr)) curr = 0;
      curr += stepDelta;
      if (curr <= min) {
        updateTenure(min.toString());
        return;
      }
      const clamped = Math.min(max, curr);
      updateTenure(`${clamped}`);
    };
    const handleTenureInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      const iv = e.target.value;
      if (iv === '') {
        updateTenure('');
        return;
      }
      const parsed = parseInt(iv, 10);
      if (Number.isNaN(parsed)) {
        updateTenure('0');
        return;
      }
      const clamped = Math.min(max, Math.max(min, parsed));
      updateTenure(`${clamped}`);
    };
    const handleUnitSwitch = (newUnit: 'm' | 'y') => {
      if (disabled || newUnit === effectiveUnit) return;
      if (rt && setRt) {
        const rawNum = parseInt(rt.tenure, 10) || 0;
        const converted =
          newUnit === 'm' ? `${Math.round(rawNum * 12)}` : `${Math.round(rawNum / 12)}`;
        setRt({
          ...rt,
          tenure: converted,
          tenureFormat: newUnit,
        });
      }
      onUnitChange?.(newUnit);
    };
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    return (
      <div className={rootContainerClass}>
        {!embedded && (
          <h5 className={`${styles.title} ${styles.titleCenter}`}>{title || 'Tenure'}</h5>
        )}
        <div className={styles.joinedRow}>
          {tenureDecSteps.map((step) => (
            <button
              key={`tenure-dec-${step}`}
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleTenureStep(step)}
              disabled={disabled}
              aria-label={`Decrease tenure by ${Math.abs(step)}`}
            >
              {step > 0 ? `-${step}` : `${step}`}
            </button>
          ))}
          <div className={styles.joinedInputWrapper}>
            <input
              type="number"
              placeholder={placeholder}
              min={min}
              max={max}
              className={styles.joinedInputField}
              value={tenureValStr}
              disabled={disabled}
              readOnly={readOnly}
              onChange={handleTenureInputChange}
              aria-label={title || 'Tenure'}
            />
          </div>
          {tenureIncSteps.map((step) => (
            <button
              key={`tenure-inc-${step}`}
              type="button"
              className={styles.stepperBtn}
              onClick={() => handleTenureStep(step)}
              disabled={disabled}
              aria-label={`Increase tenure by ${step}`}
            >
              {step > 0 ? `+${step}` : `${step}`}
            </button>
          ))}
          {units.map((u) => {
            const isActive = effectiveUnit === u.id;
            return (
              <button
                key={`unit-${u.id}`}
                type="button"
                className={`${styles.unitBtn} ${isActive ? styles.activeUnit : ''}`}
                onClick={() => handleUnitSwitch(u.id as 'm' | 'y')}
                disabled={disabled}
                title={u.title || u.label}
                aria-label={u.title || u.label}
              >
                {u.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
TenurePicker.displayName = 'TenurePicker';
// =============================================================================
// VARIANT: Paired & Stacked-Paired
// =============================================================================
const PairedPicker: React.FC<ValuePickerProps> = React.memo(
  ({
    variant = 'paired',
    title,
    sourceBadgeText = 'Source',
    targetBadgeText = 'Target',
    sourceSlot,
    targetSlot,
    sourceValue,
    targetValue,
    onSourceChange,
    onTargetChange,
    sourceOptions,
    targetOptions,
    sourcePlaceholder,
    targetPlaceholder,
    disabled = false,
    readOnly = false,
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
  }) => {
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    return (
      <div className={rootContainerClass}>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div
          className={`${styles.pairedStackedWrapper} ${
            variant === 'stacked-paired' ? styles.pairedStackedWrapperStack : ''
          }`.trim()}
        >
          {/* Source column */}
          <div className={styles.pairedStackedColumn}>
            <div className={styles.pairedStackedLabel}>{sourceBadgeText}</div>
            <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
              {sourceSlot ? (
                sourceSlot
              ) : sourceOptions && sourceOptions.length > 0 ? (
                <select
                  className={styles.pairedInput}
                  value={sourceValue ?? ''}
                  onChange={(e) => onSourceChange?.(e.target.value)}
                  disabled={disabled}
                  aria-label={sourceBadgeText}
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={styles.pairedInput}
                  value={sourceValue ?? ''}
                  placeholder={sourcePlaceholder || 'Select source'}
                  onChange={(e) => onSourceChange?.(e.target.value)}
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-label={sourceBadgeText}
                />
              )}
            </div>
          </div>
          {/* Target column */}
          <div className={styles.pairedStackedColumn}>
            <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
              {targetBadgeText}
            </div>
            <div className={styles.pairedStackedSlot}>
              {targetSlot ? (
                targetSlot
              ) : targetOptions && targetOptions.length > 0 ? (
                <select
                  className={styles.pairedInput}
                  value={targetValue ?? ''}
                  onChange={(e) => onTargetChange?.(e.target.value)}
                  disabled={disabled}
                  aria-label={targetBadgeText}
                >
                  {targetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={styles.pairedInput}
                  value={targetValue ?? ''}
                  placeholder={targetPlaceholder || 'Select target'}
                  onChange={(e) => onTargetChange?.(e.target.value)}
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-label={targetBadgeText}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
PairedPicker.displayName = 'PairedPicker';
// =============================================================================
// VARIANT: Date Range Selector
// =============================================================================
const DateRangePicker: React.FC<ValuePickerProps> = React.memo(
  ({
    title,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    startBadgeText,
    endBadgeText,
    startMinDate,
    dateMode = 'date',
    startOptions,
    endOptions,
    startYearOptions,
    endYearOptions,
    startTitle = 'Start',
    endTitle = 'End',
    disabled = false,
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
    variant = 'stacked-paired',
  }) => {
    const today = useMemo(() => getDateAsISO(), []);
    const resolvedStartBadge = startBadgeText || startTitle;
    const resolvedEndBadge = endBadgeText || endTitle;
    const effectiveStartYearOptions = startYearOptions || startOptions || [];
    const effectiveEndYearOptions = endYearOptions || endOptions || [];
    const handleStartYearChange = (val: string) => {
      setStartDate?.(val);
      if (endDate && Number(val) > Number(endDate)) {
        setEndDate?.(val);
      }
    };
    const handleEndYearChange = (val: string) => {
      if (startDate && Number(val) < Number(startDate)) {
        setEndDate?.(startDate);
        return;
      }
      setEndDate?.(val);
    };
    const handleStartDateChange = (val: string) => {
      setStartDate?.(val);
      if (endDate && val && val > endDate) {
        setEndDate?.(val);
      }
    };
    const handleEndDateChange = (val: string) => {
      if (startDate && val && val < startDate) {
        setEndDate?.(startDate);
        return;
      }
      setEndDate?.(val);
    };
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    if (dateMode === 'year') {
      const availableEndOptions = effectiveEndYearOptions.filter(
        (year) => !startDate || Number(year) >= Number(startDate)
      );
      return (
        <div className={rootContainerClass}>
          {title && <h5 className={styles.title}>{title}</h5>}
          <div
            className={`${styles.pairedStackedWrapper} ${
              variant === 'stacked-paired' ? styles.pairedStackedWrapperStack : ''
            }`.trim()}
          >
            <div className={styles.pairedStackedColumn}>
              <div className={styles.pairedStackedLabel}>
                {resolvedStartBadge} Year
              </div>
              <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
                <select
                  className={styles.pairedSelect}
                  value={startDate ?? ''}
                  onChange={(e) => handleStartYearChange(e.target.value)}
                  disabled={disabled}
                  aria-label={`${resolvedStartBadge} Year`}
                >
                  {effectiveStartYearOptions.map((year) => (
                    <option key={`s-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.pairedStackedColumn}>
              <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
                {resolvedEndBadge} Year
              </div>
              <div className={styles.pairedStackedSlot}>
                <select
                  className={styles.pairedSelect}
                  value={endDate ?? ''}
                  onChange={(e) => handleEndYearChange(e.target.value)}
                  disabled={disabled}
                  aria-label={`${resolvedEndBadge} Year`}
                >
                  {availableEndOptions.map((year) => (
                    <option key={`e-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={rootContainerClass}>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div
          className={`${styles.pairedStackedWrapper} ${
            variant === 'stacked-paired' ? styles.pairedStackedWrapperStack : ''
          }`.trim()}
        >
          <div className={styles.pairedStackedColumn}>
            <div className={styles.pairedStackedLabel}>
              {resolvedStartBadge}
            </div>
            <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
              <input
                type="date"
                min={startMinDate || undefined}
                max={endDate || today}
                value={startDate ?? ''}
                className={styles.pairedInput}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={disabled}
                aria-label={resolvedStartBadge}
              />
            </div>
          </div>
          <div className={styles.pairedStackedColumn}>
            <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
              {resolvedEndBadge}
            </div>
            <div className={styles.pairedStackedSlot}>
              <input
                type="date"
                min={startDate || undefined}
                max={today}
                value={endDate ?? ''}
                className={styles.pairedInput}
                onChange={(e) => handleEndDateChange(e.target.value)}
                disabled={disabled}
                aria-label={resolvedEndBadge}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';
// =============================================================================
// VARIANT: Grid Matrix
// =============================================================================
const GridPicker: React.FC<ValuePickerProps> = React.memo(
  ({
    title,
    gridRows = DEFAULT_DURATION_MATRIX_ROWS,
    selectedGridId,
    onGridSelect,
    value,
    onChange,
    setInputAmount,
    disabled = false,
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
  }) => {
    const effectiveValue = value !== undefined ? value : '';
    const effectiveOnChange = onChange || setInputAmount || (() => {});
    const handleGridItemClick = (item: GridItem) => {
      if (disabled) return;
      onGridSelect?.(item);
      effectiveOnChange(item.value.toString());
    };
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    return (
      <div className={rootContainerClass}>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div className={styles.matrixContainer} role="grid" aria-label={title || 'Duration Grid'}>
          {gridRows.map((row, rowIdx) => (
            <div key={`matrix-row-${rowIdx}`} className={styles.matrixRow} role="row">
              {row.map((cell) => {
                const isSelected = selectedGridId
                  ? cell.id === selectedGridId
                  : cell.value.toString() === effectiveValue.toString();
                return (
                  <button
                    key={cell.id}
                    type="button"
                    role="gridcell"
                    className={`${styles.matrixCell} ${isSelected ? styles.matrixCellActive : ''}`}
                    onClick={() => handleGridItemClick(cell)}
                    disabled={disabled}
                    aria-selected={isSelected}
                    title={`${cell.title} (${cell.value})`}
                  >
                    {cell.title}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
GridPicker.displayName = 'GridPicker';
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
    prev.unit !== next.unit ||
    prev.sourceBadgeText !== next.sourceBadgeText ||
    prev.targetBadgeText !== next.targetBadgeText ||
    prev.sourceValue !== next.sourceValue ||
    prev.targetValue !== next.targetValue ||
    prev.startDate !== next.startDate ||
    prev.endDate !== next.endDate ||
    prev.startBadgeText !== next.startBadgeText ||
    prev.endBadgeText !== next.endBadgeText ||
    prev.selectedGridId !== next.selectedGridId
  ) {
    return false;
  }
  // Compare stepRows if reference changed
  if (prev.stepRows !== next.stepRows) {
    if (!prev.stepRows || !next.stepRows) return false;
    if (prev.stepRows.length !== next.stepRows.length) return false;
  }
  // Compare rt state
  if (prev.rt !== next.rt) {
    if (!prev.rt || !next.rt) return false;
    if (
      prev.rt.roi !== next.rt.roi ||
      prev.rt.tenure !== next.rt.tenure ||
      prev.rt.tenureFormat !== next.rt.tenureFormat
    ) {
      return false;
    }
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
  const { variant = 'amount' } = props;
  switch (variant) {
    case 'roi':
      return <RoiPicker {...props} />;
    case 'tenure':
      return <TenurePicker {...props} />;
    case 'paired':
    case 'stacked-paired':
      return <PairedPicker {...props} />;
    case 'date-range':
      return <DateRangePicker {...props} />;
    case 'grid':
      return <GridPicker {...props} />;
    case 'amount':
    default:
      return <AmountPicker {...props} />;
  }
};
export const ValuePicker = React.memo(BaseValuePicker, arePropsEqual);
export default ValuePicker;
