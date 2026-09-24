import React from 'react';
import type { PairedValuePickerOption } from './pairedPickerTypes';
import styles from '../PairedValuePicker.module.scss';
interface PairedPickerBridgeProps {
  bridgeLabel?: string;
  bridgeValue?: string | number;
  onBridgeChange?: (value: string) => void;
  bridgeOptions?: PairedValuePickerOption[];
  bridgeSlot?: React.ReactNode;
  selectId: string;
  disabled?: boolean;
}
export const PairedPickerBridge = ({
  bridgeLabel,
  bridgeValue,
  onBridgeChange,
  bridgeOptions,
  bridgeSlot,
  selectId,
  disabled,
}: PairedPickerBridgeProps) => (
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
);
