'use client';
import React from 'react';
import styles from '../PairedPicker.module.scss';
export interface PairedDatePickerSectionProps {
  title?: string;
  rootContainerClass: string;
  orientation?: 'row' | 'column';
  startLabel: string;
  endLabel: string;
  startMinDate?: string;
  today: string;
  startDate?: string | null;
  endDate?: string | null;
  disabled?: boolean;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}
export const PairedDatePickerSection: React.FC<PairedDatePickerSectionProps> = React.memo(
  ({
    title,
    rootContainerClass,
    orientation,
    startLabel,
    endLabel,
    startMinDate,
    today,
    startDate,
    endDate,
    disabled,
    onStartDateChange,
    onEndDateChange,
  }) => (
    <div className={rootContainerClass}>
      {title && <h5 className={styles.title}>{title}</h5>}
      <div
        className={`${styles.pairedStackedWrapper} ${
          orientation === 'column' ? styles.pairedStackedWrapperStack : ''
        }`.trim()}
      >
        <div className={styles.pairedStackedColumn}>
          <div className={styles.pairedStackedLabel}>
            {startLabel}
          </div>
          <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
            <input
              type="date"
              min={startMinDate || undefined}
              max={endDate || today}
              value={startDate ?? ''}
              className={styles.pairedInput}
              onChange={(e) => onStartDateChange(e.target.value)}
              disabled={disabled}
              aria-label={startLabel}
            />
          </div>
        </div>
        <div className={styles.pairedStackedColumn}>
          <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
            {endLabel}
          </div>
          <div className={styles.pairedStackedSlot}>
            <input
              type="date"
              min={startDate || undefined}
              max={today}
              value={endDate ?? ''}
              className={styles.pairedInput}
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={disabled}
              aria-label={endLabel}
            />
          </div>
        </div>
      </div>
    </div>
  )
);
PairedDatePickerSection.displayName = 'PairedDatePickerSection';
