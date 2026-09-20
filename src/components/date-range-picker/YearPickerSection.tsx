'use client';
import React from 'react';
import styles from '../PairedPicker.module.scss';
export interface YearPickerSectionProps {
  title?: string;
  rootContainerClass: string;
  variant?: 'paired' | 'stacked-paired';
  resolvedStartBadge: string;
  resolvedEndBadge: string;
  startDate?: string | null;
  endDate?: string | null;
  disabled?: boolean;
  effectiveStartYearOptions: string[];
  availableEndOptions: string[];
  onStartYearChange: (val: string) => void;
  onEndYearChange: (val: string) => void;
}
export const YearPickerSection: React.FC<YearPickerSectionProps> = React.memo(
  ({
    title,
    rootContainerClass,
    variant,
    resolvedStartBadge,
    resolvedEndBadge,
    startDate,
    endDate,
    disabled,
    effectiveStartYearOptions,
    availableEndOptions,
    onStartYearChange,
    onEndYearChange,
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
            {resolvedStartBadge} Year
          </div>
          <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
            <select
              className={styles.pairedSelect}
              value={startDate ?? ''}
              onChange={(e) => onStartYearChange(e.target.value)}
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
        </div>
        <div className={styles.pairedStackedColumn}>
          <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
            {resolvedEndBadge} Year
          </div>
          <div className={styles.pairedStackedSlot}>
            <select
              className={styles.pairedSelect}
              value={endDate ?? ''}
              onChange={(e) => onEndYearChange(e.target.value)}
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
        </div>
      </div>
    </div>
  )
);
YearPickerSection.displayName = 'YearPickerSection';
