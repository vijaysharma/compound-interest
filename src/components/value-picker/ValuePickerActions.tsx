import React from 'react';
import styles from '../ValuePicker.module.scss';
export interface ValuePickerActionsProps {
  operation: '+' | '-';
  disabled?: boolean;
  numericValue: number;
  min: number;
  effectiveDefaultStep: number;
  onClear: () => void;
  onPlusClick: () => void;
  onMinusClick: () => void;
}
export const ValuePickerActions: React.FC<ValuePickerActionsProps> = React.memo(
  ({
    operation,
    disabled,
    numericValue,
    min,
    effectiveDefaultStep,
    onClear,
    onPlusClick,
    onMinusClick,
  }) => (
    <div className={styles.actionsCluster}>
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.clearBtn}`}
        onClick={onClear}
        disabled={disabled || numericValue === min}
        title="Clear value (C)"
        aria-label="Clear value"
      >
        C
      </button>
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.plusBtn} ${operation === '+' ? styles.activeOp : ''}`}
        onClick={onPlusClick}
        disabled={disabled}
        title={operation === '+' ? `Add ${effectiveDefaultStep}` : 'Switch to add mode (+)'}
        aria-label="Add value"
      >
        +
      </button>
      <button
        type="button"
        className={`${styles.actionBtn} ${styles.minusBtn} ${operation === '-' ? styles.activeOp : ''}`}
        onClick={onMinusClick}
        disabled={disabled || numericValue <= 0}
        title={operation === '-' ? `Subtract ${effectiveDefaultStep}` : 'Switch to subtract mode (-)'}
        aria-label="Subtract value"
      >
        -
      </button>
    </div>
  )
);
ValuePickerActions.displayName = 'ValuePickerActions';
