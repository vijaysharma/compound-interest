'use client';
import React, { useState, useId, useMemo, useEffect } from 'react';
import styles from './ValuePicker.module.scss';
import convertToWords from '../utilities/currency';
import { sanctnum } from '../utilities/numSanitity';
import { getDateAsISO, getNearest } from '../utilities/utility';
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
  'amount' | 'roi' | 'tenure' | 'paired' | 'stacked-paired' | 'date-range' | 'grid';
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
  stepRows?: ValuePickerStep[][] | ValuePickerStep[];
  stepData?: Array<{ id?: string; value: string | number; title?: string; label?: string }>;
  stepSizePrefix?: string;
  typeSizePrefix?: string;
  compact?: boolean;
  /**
   * Render the control for placement inside a ValuePicker.Paired slot: drops
   * the outer margins, the joined row's own border and radius, and the title,
   * since the paired badge already labels it.
   */
  embedded?: boolean;
  currencySymbol?: string;
  locale?: string;
  min?: number;
  max?: number;
  defaultStep?: number;
  showWords?: boolean;
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
export interface ValuePickerComponent extends React.FC<ValuePickerProps> {
  Amount: React.FC<ValuePickerProps>;
  ROI: React.FC<ValuePickerProps>;
  Tenure: React.FC<ValuePickerProps>;
  Paired: React.FC<ValuePickerProps>;
  StackedPaired: React.FC<ValuePickerProps>;
  DateRange: React.FC<ValuePickerProps>;
  Grid: React.FC<ValuePickerProps>;
}
/**
 * Mobile-first generic ValuePicker component with modular SCSS.
 * Accurately reproduces the visual layout, touch targets, and responsive desktop behavior.
 */
export const ValuePicker: ValuePickerComponent = (({
  variant = 'amount',
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
  compact = false,
  embedded = false,
  layout = 'auto',
  disabled = false,
  readOnly = false,
  placeholder,
  // ROI props
  roiSteps = DEFAULT_ROI_STEPS,
  rt,
  setRt,
  // Tenure props
  tenureDecSteps = DEFAULT_TENURE_DECREMENT_STEPS,
  tenureIncSteps = DEFAULT_TENURE_INCREMENT_STEPS,
  unit,
  onUnitChange,
  units = DEFAULT_TENURE_UNITS,
  // Paired props
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
  // Date props
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
  navData,
  data,
  startTitle = 'Start',
  endTitle = 'End',
  // Grid props
  gridRows = DEFAULT_DURATION_MATRIX_ROWS,
  selectedGridId,
  onGridSelect,
}: ValuePickerProps) => {
  const componentId = useId();
  // Resolve value and onChange from either prop
  const effectiveValue =
    value !== undefined ? value : inputAmount !== undefined ? inputAmount : '0';
  const effectiveOnChange = onChange || setInputAmount || (() => {});
  // Resolve tabs and active tab
  const providedTabs = tabs !== undefined ? tabs : typeData;
  const resolvedTabs =
    providedTabs !== undefined ? providedTabs : title ? [] : DEFAULT_VALUE_PICKER_TABS;
  const currentActiveTab = controlledTab !== undefined ? controlledTab : type;
  const effectiveOnTabChange = onTabChange || setType;
  // Internal tab state when uncontrolled
  const [internalTab, setInternalTab] = useState<string>(
    currentActiveTab ?? defaultTab ?? resolvedTabs?.[0]?.id ?? ''
  );
  const currentTab = currentActiveTab !== undefined ? currentActiveTab : internalTab;
  // Active operation mode: '+' adds quick-steps, '-' subtracts quick-steps
  const [operation, setOperation] = useState<'+' | '-'>('+');
  // ROI operation mode
  const [roiOp, setRoiOp] = useState<'+' | '-'>('+');
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
  // Date nearest effect for historical nav data
  const effectiveNavData = navData || data;
  useEffect(() => {
    if (
      variant !== 'date-range' ||
      dateMode !== 'date' ||
      !effectiveNavData ||
      effectiveNavData.length === 0
    ) {
      return;
    }
    if (startDate) getNearest(startDate, effectiveNavData);
    if (endDate) getNearest(endDate, effectiveNavData);
  }, [variant, dateMode, startDate, endDate, effectiveNavData]);
  const layoutClass =
    layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
  const compactClass = compact ? styles.compact : '';
  const embeddedClass = embedded ? styles.embedded : '';
  const rootContainerClass =
    `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
  // ===========================================================================
  // VARIANT 1: Rate of Interest (Screenshot 1)
  // ===========================================================================
  if (variant === 'roi') {
    const roiValStr = rt
      ? rt.roi
        ? rt.roi.toString().replace(/^0+/, '') || '0'
        : '0'
      : effectiveValue.toString();
    const handleRoiStep = (stepAmt: number) => {
      if (disabled) return;
      let curr = roiValStr ? parseFloat(roiValStr) : 0;
      if (Number.isNaN(curr)) curr = 0;
      if (roiOp === '+') {
        curr += stepAmt;
      } else {
        curr -= stepAmt;
        if (curr <= (min !== undefined ? min : 0)) {
          if (rt && setRt) {
            setRt({ ...rt, roi: '0' });
          } else {
            effectiveOnChange('0');
          }
          setRoiOp('+');
          return;
        }
      }
      const rounded = Math.round((curr + Number.EPSILON) * 100) / 100;
      if (rt && setRt) {
        setRt({ ...rt, roi: `${rounded}` });
      } else {
        effectiveOnChange(`${rounded}`);
      }
    };
    const handleRoiInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      const iv = e.target.value;
      if (sanctnum(iv) < 0) {
        setRoiOp('+');
        return;
      }
      if (rt && setRt) {
        setRt({ ...rt, roi: iv });
      } else {
        effectiveOnChange(iv);
      }
    };
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
              placeholder={placeholder || '0'}
              min={min !== undefined ? min : 0}
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
  // ===========================================================================
  // VARIANT 2: Tenure (Screenshot 2)
  // ===========================================================================
  if (variant === 'tenure') {
    const tenureValStr = rt
      ? rt.tenure.toString().replace(/^0+/, '') || '0'
      : effectiveValue.toString();
    const effectiveUnit = rt ? rt.tenureFormat : unit || 'y';
    const handleTenureStep = (stepDelta: number) => {
      if (disabled) return;
      let curr = parseInt(tenureValStr, 10);
      if (Number.isNaN(curr)) curr = 0;
      curr += stepDelta;
      if (curr <= (min !== undefined ? min : 0)) {
        if (rt && setRt) {
          setRt({ ...rt, tenure: '0' });
        } else {
          effectiveOnChange('0');
        }
        return;
      }
      if (rt && setRt) {
        setRt({ ...rt, tenure: `${curr}` });
      } else {
        effectiveOnChange(`${curr}`);
      }
    };
    const handleTenureInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      const iv = e.target.value;
      if (rt && setRt) {
        setRt({ ...rt, tenure: iv });
      } else {
        effectiveOnChange(iv);
      }
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
              placeholder={placeholder || '0'}
              min={min !== undefined ? min : 0}
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
  // ===========================================================================
  // VARIANT 3: Paired / Dual Endpoint Selector (Screenshot 3)
  // ===========================================================================
  if (variant === 'paired' || variant === 'stacked-paired') {
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
  // ===========================================================================
  // VARIANT 4: Date Range Selector (Screenshot 4)
  // ===========================================================================
  if (variant === 'date-range') {
    const today = getDateAsISO();
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
    if (dateMode === 'year') {
      const availableEndOptions = effectiveEndYearOptions.filter(
        (year) => !startDate || Number(year) >= Number(startDate)
      );
      return (
        <div className={rootContainerClass}>
          {title && <h5 className={styles.title}>{title}</h5>}
          <div className={styles.joinedRow}>
            <div className={`${styles.pairedBadge} ${styles.leftBadge}`}>
              {resolvedStartBadge} Year
            </div>
            <div className={`${styles.dateSlot} ${styles.slotLeft}`}>
              <select
                className={styles.dateSelect}
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
            <div className={styles.dateSlot}>
              <select
                className={styles.dateSelect}
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
            <div className={`${styles.pairedBadge} ${styles.rightBadge}`}>
              {resolvedEndBadge} Year
            </div>
          </div>
        </div>
      );
    }
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
    return (
      <div className={rootContainerClass}>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div className={styles.joinedRow}>
          {setStartDate && (
            <>
              <div className={`${styles.pairedBadge} ${styles.leftBadge}`}>
                {resolvedStartBadge}
              </div>
              <div className={`${styles.dateSlot} ${styles.slotLeft}`}>
                <input
                  type="date"
                  min={startMinDate || undefined}
                  max={endDate || today}
                  value={startDate ?? ''}
                  className={styles.dateInput}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  disabled={disabled}
                  aria-label={resolvedStartBadge}
                />
              </div>
            </>
          )}
          {setEndDate && (
            <>
              <div className={styles.dateSlot}>
                <input
                  type="date"
                  min={startDate || undefined}
                  max={today}
                  value={endDate ?? ''}
                  className={styles.dateInput}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={disabled}
                  aria-label={resolvedEndBadge}
                />
              </div>
              <div className={`${styles.pairedBadge} ${styles.rightBadge}`}>{resolvedEndBadge}</div>
            </>
          )}
        </div>
      </div>
    );
  }
  // ===========================================================================
  // VARIANT 5: Multi-Row Duration Matrix Grid (Screenshot 5)
  // ===========================================================================
  if (variant === 'grid') {
    const handleGridItemClick = (item: GridItem) => {
      if (disabled) return;
      onGridSelect?.(item);
      effectiveOnChange(item.value.toString());
    };
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
    setLocalInput(clamped === 0 ? '' : clamped.toLocaleString(locale));
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
  // Direct typing handler with persistent delimiters and smooth cursor preservation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    const input = e.target;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, cursor).replace(/[^0-9]/g, '').length;
    const rawDigits = input.value.replace(/[^0-9]/g, '');
    if (rawDigits === '') {
      setLocalInput('');
      updateNumericValue(min);
      return;
    }
    const parsed = parseInt(rawDigits, 10);
    const newVal = Number.isNaN(parsed) ? min : parsed;
    const formatted = parsed.toLocaleString(locale);
    setLocalInput(formatted);
    updateNumericValue(newVal);
    requestAnimationFrame(() => {
      let count = 0;
      let newCursor = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) {
          count++;
          if (count === digitsBeforeCursor) {
            newCursor = i + 1;
            break;
          }
        }
      }
      input.setSelectionRange(newCursor, newCursor);
    });
  };
  // Keyboard navigation & smart delimiter handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly) return;
    if (e.key === 'Backspace') {
      const input = e.currentTarget;
      const { selectionStart, selectionEnd } = input;
      if (selectionStart !== null && selectionStart === selectionEnd && selectionStart > 1) {
        if (input.value[selectionStart - 1] === ',') {
          e.preventDefault();
          const before = input.value.slice(0, selectionStart - 2);
          const after = input.value.slice(selectionStart);
          const combined = before + after;
          const rawDigits = combined.replace(/[^0-9]/g, '');
          if (rawDigits === '') {
            setLocalInput('');
            updateNumericValue(min);
            return;
          }
          const parsed = parseInt(rawDigits, 10);
          const newVal = Number.isNaN(parsed) ? min : parsed;
          const formatted = parsed.toLocaleString(locale);
          setLocalInput(formatted);
          updateNumericValue(newVal);
          const targetDigits = before.replace(/[^0-9]/g, '').length;
          requestAnimationFrame(() => {
            let count = 0;
            let newCursor = 0;
            for (let i = 0; i < formatted.length; i++) {
              if (/[0-9]/.test(formatted[i])) {
                count++;
                if (count === targetDigits) {
                  newCursor = i + 1;
                  break;
                }
              }
            }
            input.setSelectionRange(newCursor, newCursor);
          });
          return;
        }
      }
    }
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
  // Formatted display string: maintains Indian grouping always, preventing visual jump
  const displayValue = isFocused
    ? localInput
    : numericValue === 0
      ? '0'
      : numericValue.toLocaleString(locale);
  // In-words string
  const wordsText = showWords && numericValue > 0 ? convertToWords(numericValue, locale) : '';
  return (
    <div className={rootContainerClass}>
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
                setLocalInput(numericValue === 0 ? '' : numericValue.toLocaleString(locale));
              }}
              onBlur={() => {
                setIsFocused(false);
                setLocalInput(numericValue === 0 ? '0' : numericValue.toLocaleString(locale));
              }}
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
}) as ValuePickerComponent;
ValuePicker.Amount = (props: ValuePickerProps) => <ValuePicker {...props} variant="amount" />;
ValuePicker.ROI = (props: ValuePickerProps) => <ValuePicker {...props} variant="roi" />;
ValuePicker.Tenure = (props: ValuePickerProps) => <ValuePicker {...props} variant="tenure" />;
ValuePicker.Paired = (props: ValuePickerProps) => <ValuePicker {...props} variant="paired" />;
ValuePicker.StackedPaired = (props: ValuePickerProps) => (
  <ValuePicker {...props} variant="stacked-paired" />
);
ValuePicker.DateRange = (props: ValuePickerProps) => (
  <ValuePicker {...props} variant="date-range" />
);
ValuePicker.Grid = (props: ValuePickerProps) => <ValuePicker {...props} variant="grid" />;
export default ValuePicker;
