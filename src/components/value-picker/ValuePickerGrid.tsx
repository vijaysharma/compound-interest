import React from 'react';
import type { ValuePickerStep } from '../../data/valuePickerData';
import styles from '../ValuePicker.module.scss';
export interface ValuePickerGridProps {
  resolvedStepRows: ValuePickerStep[][];
  singleRow?: boolean;
  operation: '+' | '-';
  effectiveSymbol: string | null;
  locale: string;
  disabled?: boolean;
  numericValue: number;
  min: number;
  onStepClick: (stepVal: number) => void;
}
export const ValuePickerGrid: React.FC<ValuePickerGridProps> = React.memo(
  ({
    resolvedStepRows,
    singleRow,
    operation,
    effectiveSymbol,
    locale,
    disabled,
    numericValue,
    min,
    onStepClick,
  }) => {
    if (!resolvedStepRows || resolvedStepRows.length === 0) return null;
    return (
      <div className={`${styles.gridContainer} ${singleRow ? styles.singleRowGrid : ''}`.trim()}>
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
                  className={`${styles.gridCell} ${isPrimaryRow ? styles.rowPrimary : styles.rowSecondary}`}
                  onClick={() => onStepClick(step.value)}
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
    );
  }
);
ValuePickerGrid.displayName = 'ValuePickerGrid';
