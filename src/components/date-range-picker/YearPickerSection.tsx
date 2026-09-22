'use client';
import React from 'react';
import styles from '../PairedPicker.module.scss';
export interface YearPickerSectionProps {
  title?: string;
  rootContainerClass: string;
  orientation?: 'row' | 'column';
  startLabel: string;
  endLabel: string;
  startDate?: string | null;
  endDate?: string | null;
  disabled?: boolean;
  startYearOptions: string[];
  endYearOptions: string[];
  onStartYearChange: (val: string) => void;
  onEndYearChange: (val: string) => void;
}
export const YearPickerSection: React.FC<YearPickerSectionProps> = React.memo(
  ({
    title,
    rootContainerClass,
    orientation,
    startLabel,
    endLabel,
    startDate,
    endDate,
    disabled,
    startYearOptions,
    endYearOptions,
    onStartYearChange,
    onEndYearChange,
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
            {startLabel} Year
          </div>
          <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
            <select
              className={styles.pairedSelect}
              value={startDate ?? ''}
              onChange={(e) => onStartYearChange(e.target.value)}
              disabled={disabled}
              aria-label={`${startLabel} Year`}
            >
              {startYearOptions.map((year) => (
                <option key={`s-${year}`} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.pairedStackedColumn}>
          <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
            {endLabel} Year
          </div>
          <div className={styles.pairedStackedSlot}>
            <select
              className={styles.pairedSelect}
              value={endDate ?? ''}
              onChange={(e) => onEndYearChange(e.target.value)}
              disabled={disabled}
              aria-label={`${endLabel} Year`}
            >
              {endYearOptions.map((year) => (
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
