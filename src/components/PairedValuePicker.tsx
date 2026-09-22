'use client';
import React, { useId, useState } from 'react';
import { ValuePickerActions } from './value-picker/ValuePickerActions';
import { ValuePickerGrid } from './value-picker/ValuePickerGrid';
import { useValuePickerState } from './value-picker/useValuePickerState';
import { MAX_SAFE_FINANCIAL_VALUE } from './value-picker/inputUtils';
import { sanctnum } from '../utilities/numSanitity';
import { DEFAULT_PAIRED_AMOUNT_STEPS } from '../data/valuePickerData';
import { pickerRootClass, type PickerChromeProps, type PickerScale } from './value-picker/chrome';
import vp from './ValuePicker.module.scss';
import styles from './PairedValuePicker.module.scss';
export interface PairedValuePickerOption {
  label: string;
  value: string | number;
}
type PairedValuePickerStepData = Array<{
  id?: string;
  value: string | number;
  title?: string;
  label?: string;
}>;
type Side = 'primary' | 'secondary';
/**
 * The scales this card supports — `PickerScale` minus `auto`, and defaulting to
 * `container` rather than to `auto`.
 *
 * The card borrows its chrome from ValuePicker, whose rules size off the
 * viewport through `tablet-up`. It has no viewport-keyed tier set of its own,
 * so an `auto` instance would fall through to those borrowed rules at equal
 * specificity, leaving the result to the source order of two CSS modules — and
 * jumping to the 44px/46px/20px web scale in the ~380px column this card was
 * built for. Excluding the value makes that a compile error instead of a
 * silently ignored prop.
 */
export type PairedValuePickerScale = Exclude<PickerScale, 'auto'>;
/**
 * `title` is omitted because the card has two headings of its own
 * (`primaryTitle` / `secondaryTitle`) fused into a split title bar, with no
 * single slot a shared one could occupy.
 */
export interface PairedValuePickerProps
  extends Omit<PickerChromeProps, 'title' | 'scale'> {
  /** See `PairedValuePickerScale`. Defaults to `container`. */
  scale?: PairedValuePickerScale;
  /** Heading over the left field, e.g. "Withdrawal per instalment". */
  primaryTitle: string;
  primaryValue: number;
  onPrimaryChange: (value: number) => void;
  primaryMin?: number;
  primaryMax?: number;
  primaryStepData?: PairedValuePickerStepData;
  /** Heading over the right field, e.g. "Of which to growth funds". */
  secondaryTitle: string;
  secondaryValue: number;
  onSecondaryChange: (value: number) => void;
  secondaryMin?: number;
  secondaryMax?: number;
  secondaryStepData?: PairedValuePickerStepData;
  /**
   * Label of the row under the card, e.g. "Yearly increase". The row is dropped
   * entirely when neither `bridgeOptions` nor `bridgeSlot` is supplied.
   */
  bridgeLabel?: string;
  bridgeValue?: string | number;
  onBridgeChange?: (value: string) => void;
  bridgeOptions?: PairedValuePickerOption[];
  /** Ties the label to the generated dropdown; defaults to a generated id. */
  bridgeId?: string;
  /** Renders in place of the generated dropdown, for a non-select bridge. */
  bridgeSlot?: React.ReactNode;
  /**
   * Treats the right field as a share carved out of the left one: it caps at
   * the left value, and a cut there drags it down. Turn off for two
   * independent amounts.
   */
  capSecondaryToPrimary?: boolean;
  symbol?: string | null;
  locale?: string;
  singleRow?: boolean;
  showWords?: boolean;
  allowDecimals?: boolean;
  defaultStep?: number;
  readOnly?: boolean;
}
/**
 * Two amounts in one ValuePicker-styled card: a split title bar, both fields
 * behind a single currency badge, and one shared C / + / - and step row that
 * drives whichever field was focused last.
 *
 * The three controls travel as one component because their values constrain
 * each other — the right field is a share of the left, and the bridge under the
 * card escalates both.
 *
 * Sizing keys off the card's own container by default rather than the viewport,
 * because the column it is built for is ~380px wide on a full-size screen. See
 * `PairedValuePickerScale`.
 */
const BasePairedValuePicker: React.FC<PairedValuePickerProps> = ({
  primaryTitle,
  primaryValue,
  onPrimaryChange,
  primaryMin = 0,
  primaryMax,
  primaryStepData,
  secondaryTitle,
  secondaryValue,
  onSecondaryChange,
  secondaryMin = 0,
  secondaryMax,
  secondaryStepData,
  bridgeLabel,
  bridgeValue,
  onBridgeChange,
  bridgeOptions,
  bridgeId,
  bridgeSlot,
  capSecondaryToPrimary = true,
  symbol = '₹',
  locale = 'en-IN',
  singleRow = true,
  showWords = false,
  allowDecimals,
  defaultStep,
  scale = 'container',
  compact = true,
  embedded = false,
  disabled = false,
  readOnly = false,
  className = '',
}) => {
  const componentId = useId();
  const selectId = bridgeId ?? `${componentId}-bridge`;
  // The shared buttons have to land somewhere, so they follow the focus and
  // start on the left field.
  const [activeSide, setActiveSide] = useState<Side>('primary');
  const primarySteps = primaryStepData ?? DEFAULT_PAIRED_AMOUNT_STEPS;
  const secondarySteps = secondaryStepData ?? primarySteps;
  const supportsDecimals = Boolean(
    allowDecimals ||
    symbol === '%' ||
    !Number.isInteger(primaryValue) ||
    !Number.isInteger(secondaryValue) ||
    primarySteps.some((step) => Number(step.value) % 1 !== 0)
  );
  const effectiveDefaultStep = defaultStep ?? (supportsDecimals ? 0.5 : 500);
  // The tighter of the two ceilings wins, so an explicit `secondaryMax` can
  // still narrow a share that is already capped by the primary.
  const secondaryCap = capSecondaryToPrimary
    ? Math.min(primaryValue, secondaryMax ?? Number.POSITIVE_INFINITY)
    : secondaryMax;
  const handlePrimaryChange = (next: string) => {
    const value = sanctnum(next, primaryMin, primaryMax);
    onPrimaryChange(value);
    // Lowering the primary below the share would otherwise leave more routed
    // out than the instalment itself carries.
    if (capSecondaryToPrimary && secondaryValue > value) {
      onSecondaryChange(value);
    }
  };
  const handleSecondaryChange = (next: string) => {
    onSecondaryChange(sanctnum(next, secondaryMin, secondaryCap));
  };
  const shared = {
    supportsDecimals,
    effectiveDefaultStep,
    locale,
    showWords,
    effectiveSymbol: symbol,
    singleRow,
    disabled,
    readOnly,
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
  const showBridge = Boolean(bridgeSlot || bridgeOptions?.length);
  const renderField = (side: Side) => {
    const state = side === 'primary' ? primaryState : secondaryState;
    const title = side === 'primary' ? primaryTitle : secondaryTitle;
    return (
      <div
        className={`${vp.inputWrapper} ${styles.field} ${
          activeSide === side ? styles.fieldActive : ''
        }`.trim()}
      >
        <input
          ref={state.inputRef}
          id={`${componentId}-${side}`}
          type="text"
          inputMode={supportsDecimals ? 'decimal' : 'numeric'}
          pattern={supportsDecimals ? '[0-9]*[.]?[0-9]*' : '[0-9]*'}
          className={vp.inputField}
          value={state.displayValue}
          suppressHydrationWarning
          disabled={disabled}
          readOnly={readOnly}
          onFocus={() => {
            setActiveSide(side);
            state.handleFocus();
          }}
          onBlur={state.handleBlur}
          onChange={state.handleInputChange}
          onKeyDown={state.handleKeyDown}
          aria-label={title}
        />
      </div>
    );
  };
  // `embedded` is the one chrome prop this card cannot resolve on its root: the
  // border it has to shed belongs to `vp.card`, whose hashed name only
  // ValuePicker's own module can reach. Hence the companion class there.
  const rootContainerClass = pickerRootClass(styles, { scale, compact, embedded, className });
  const cardClass = [vp.card, vp.cardWithMergedTitle, embedded && vp.cardEmbedded]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={rootContainerClass}>
      <div className={cardClass}>
        <div className={`${vp.titleBar} ${styles.titleBar}`}>
          <span className={styles.symbolSpacer} aria-hidden="true"></span>
          <span className={styles.titleCell}>{primaryTitle}</span>
          <span className={styles.titleCell}>{secondaryTitle}</span>
        </div>
        <div className={`${vp.inputRow} ${styles.inputRow}`}>
          {symbol !== null && (
            <div className={`${vp.symbolBadge} ${styles.symbol}`} aria-hidden="true">
              {symbol}
            </div>
          )}
          {renderField('primary')}
          {renderField('secondary')}
        </div>
        <div className={styles.controlRow} role="group" aria-label={`Adjust ${activeTitle}`}>
          <div className={styles.actions}>
            <ValuePickerActions
              operation={active.operation}
              disabled={disabled}
              numericValue={active.numericValue}
              min={activeMin}
              effectiveDefaultStep={effectiveDefaultStep}
              onClear={active.handleClear}
              onPlusClick={active.handlePlusClick}
              onMinusClick={active.handleMinusClick}
            />
          </div>
          <div className={styles.grid}>
            {/*
              `singleRow` shapes the steps into one row via the state hook, but
              the grid's own single-row mode scrolls overflow out of reach. The
              strip is shared by both fields, so the cells compress to the card
              width instead and every step stays clickable.
            */}
            <ValuePickerGrid
              resolvedStepRows={active.resolvedStepRows}
              singleRow={false}
              operation={active.operation}
              effectiveSymbol={symbol}
              locale={locale}
              disabled={disabled}
              numericValue={active.numericValue}
              min={activeMin}
              onStepClick={active.handleStepClick}
            />
          </div>
        </div>
      </div>
      {showBridge && (
        <div className={styles.bridgeRow}>
          {bridgeLabel &&
            (bridgeSlot ? (
              <span className={styles.bridgeLabel}>{bridgeLabel}</span>
            ) : (
              <label className={styles.bridgeLabel} htmlFor={selectId}>
                {bridgeLabel}
              </label>
            ))}
          {bridgeSlot ?? (
            <select
              id={selectId}
              className={styles.bridgeSelect}
              value={bridgeValue ?? ''}
              onChange={(event) => onBridgeChange?.(event.target.value)}
              disabled={disabled}
              aria-label={bridgeLabel ? undefined : 'Bridge value'}
            >
              {bridgeOptions?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      {(primaryState.wordsText || secondaryState.wordsText) && (
        <div className={styles.wordsRow} aria-live="polite" suppressHydrationWarning>
          {/* Reserves the badge's column, as the title bar does, so each
              readout stays under the field it describes. */}
          <span className={styles.symbolSpacer} aria-hidden="true"></span>
          <span className={styles.titleCell}>{primaryState.wordsText}</span>
          <span className={styles.titleCell}>{secondaryState.wordsText}</span>
        </div>
      )}
    </div>
  );
};
export const PairedValuePicker = React.memo(BasePairedValuePicker);
PairedValuePicker.displayName = 'PairedValuePicker';
export default PairedValuePicker;
