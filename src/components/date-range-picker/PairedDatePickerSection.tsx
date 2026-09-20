'use client';
import React from 'react';
import styles from '../PairedPicker.module.scss';
export interface PairedDatePickerSectionProps {
  title?: string;
  rootContainerClass: string;
  variant?: 'paired' | 'stacked-paired';
  resolvedStartBadge: string;
  resolvedEndBadge: string;
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
    variant,
    resolvedStartBadge,
    resolvedEndBadge,
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
              onChange={(e) => onStartDateChange(e.target.value)}
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
              onChange={(e) => onEndDateChange(e.target.value)}
              disabled={disabled}
              aria-label={resolvedEndBadge}
            />
          </div>
        </div>
      </div>
    </div>
  )
);
PairedDatePickerSection.displayName = 'PairedDatePickerSection';
