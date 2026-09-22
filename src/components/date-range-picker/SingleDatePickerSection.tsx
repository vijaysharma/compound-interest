'use client';
import React from 'react';
import styles from '../PairedPicker.module.scss';
export interface SingleDatePickerSectionProps {
  title?: string;
  rootContainerClass: string;
  startLabel: string;
  startMinDate?: string;
  today: string;
  startDate?: string | null;
  disabled?: boolean;
  onStartDateChange: (val: string) => void;
}
export const SingleDatePickerSection: React.FC<SingleDatePickerSectionProps> = React.memo(
  ({
    title,
    rootContainerClass,
    startLabel,
    startMinDate,
    today,
    startDate,
    disabled,
    onStartDateChange,
  }) => (
    <div className={rootContainerClass}>
      {title && <h5 className={styles.title}>{title}</h5>}
      <div className={styles.pairedStackedWrapper}>
        <div className={`${styles.pairedStackedColumn} ${styles.singleColumn}`}>
          <div className={styles.pairedStackedLabel}>
            {startLabel}
          </div>
          <div className={styles.pairedStackedSlot}>
            <input
              type="date"
              min={startMinDate || undefined}
              max={today}
              value={startDate ?? ''}
              className={styles.pairedInput}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={disabled}
              aria-label={startLabel}
            />
          </div>
        </div>
      </div>
    </div>
  )
);
SingleDatePickerSection.displayName = 'SingleDatePickerSection';
