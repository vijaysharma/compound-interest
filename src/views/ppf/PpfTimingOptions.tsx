import React from 'react';
import type { PPFDepositTiming } from '../../utilities/ppfCalculations';
import styles from '../PpfCalculator.module.scss';
interface PpfTimingOptionsProps {
  depositTiming: PPFDepositTiming;
  setDepositTiming: (timing: PPFDepositTiming) => void;
}
export function PpfTimingOptions({ depositTiming, setDepositTiming }: PpfTimingOptionsProps) {
  return (
    <>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Deposit Timing (RBI Rule)</label>
        <div className={styles.timingGrid}>
          <button
            type="button"
            className={`${styles.timingBtn} ${depositTiming === 'before_5th' ? styles.timingBtnActive : ''}`}
            onClick={() => setDepositTiming('before_5th')}
          >
            <span>On or before 5th</span>
            <span>Earns interest for same month</span>
          </button>
          <button
            type="button"
            className={`${styles.timingBtn} ${depositTiming === 'after_5th' ? styles.timingBtnActive : ''}`}
            onClick={() => setDepositTiming('after_5th')}
          >
            <span>After 5th of month</span>
            <span>Earns interest from next month</span>
          </button>
        </div>
      </div>
      <div className={styles.ruleNote}>
        <strong>RBI Rule:</strong> Interest is calculated on the lowest balance between the close of the 5th day and the end of each month.
      </div>
    </>
  );
}
