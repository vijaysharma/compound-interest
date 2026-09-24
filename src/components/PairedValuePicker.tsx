'use client';
import React, { useId } from 'react';
import { ValuePickerActions } from './value-picker/ValuePickerActions';
import { ValuePickerGrid } from './value-picker/ValuePickerGrid';
import { pickerRootClass } from './value-picker/chrome';
import { PairedPickerBridge } from './value-picker/PairedPickerBridge';
import { usePairedPickerLogic } from './value-picker/usePairedPickerLogic';
import type { PairedValuePickerProps, Side } from './value-picker/pairedPickerTypes';
import vp from './ValuePicker.module.scss';
import styles from './PairedValuePicker.module.scss';
export * from './value-picker/pairedPickerTypes';
const BasePairedValuePicker: React.FC<PairedValuePickerProps> = (props) => {
  const {
    primaryTitle, secondaryTitle, bridgeLabel, bridgeValue, onBridgeChange, bridgeOptions,
    bridgeId, bridgeSlot, symbol = '₹', locale = 'en-IN', scale = 'container', compact = true,
    embedded = false, disabled = false, readOnly = false, className = '',
  } = props;
  const componentId = useId();
  const selectId = bridgeId ?? `${componentId}-bridge`;
  const {
    activeSide, setActiveSide, supportsDecimals, effectiveDefaultStep,
    primaryState, secondaryState, active, activeMin, activeTitle,
  } = usePairedPickerLogic(props);
  const showBridge = Boolean(bridgeSlot || bridgeOptions?.length);
  const renderField = (side: Side) => {
    const state = side === 'primary' ? primaryState : secondaryState;
    const title = side === 'primary' ? primaryTitle : secondaryTitle;
    return (
      <div className={`${vp.inputWrapper} ${styles.field} ${activeSide === side ? styles.fieldActive : ''}`.trim()}>
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
          onFocus={() => { setActiveSide(side); state.handleFocus(); }}
          onBlur={state.handleBlur}
          onChange={state.handleInputChange}
          onKeyDown={state.handleKeyDown}
          aria-label={title}
        />
      </div>
    );
  };
  const rootContainerClass = pickerRootClass(styles, { scale, compact, embedded, className });
  const cardClass = [vp.card, vp.cardWithMergedTitle, embedded && vp.cardEmbedded].filter(Boolean).join(' ');
  return (
    <div className={rootContainerClass}>
      <div className={cardClass}>
        <div className={`${vp.titleBar} ${styles.titleBar}`}>
          <span className={styles.symbolSpacer} aria-hidden="true" />
          <span className={styles.titleCell}>{primaryTitle}</span>
          <span className={styles.titleCell}>{secondaryTitle}</span>
        </div>
        <div className={`${vp.inputRow} ${styles.inputRow}`}>
          {symbol !== null && <div className={`${vp.symbolBadge} ${styles.symbol}`} aria-hidden="true">{symbol}</div>}
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
        <PairedPickerBridge
          bridgeLabel={bridgeLabel}
          bridgeValue={bridgeValue}
          onBridgeChange={onBridgeChange}
          bridgeOptions={bridgeOptions}
          bridgeSlot={bridgeSlot}
          selectId={selectId}
          disabled={disabled}
        />
      )}
      {(primaryState.wordsText || secondaryState.wordsText) && (
        <div className={styles.wordsRow} aria-live="polite" suppressHydrationWarning>
          <span className={styles.symbolSpacer} aria-hidden="true" />
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
