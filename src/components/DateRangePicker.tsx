'use client';
import React, { useMemo } from 'react';
import styles from './PairedPicker.module.scss';
import { getDateAsISO } from '../utilities/utility';
import type { NavType } from '../types/types';
export interface DateRangePickerProps {
  title?: string;
  startDate?: string | null;
  endDate?: string | null;
  setStartDate?: (date: string) => void;
  setEndDate?: (date: string) => void;
  startBadgeText?: string;
  endBadgeText?: string;
  startMinDate?: string;
  dateMode?: 'date' | 'year';
  startOptions?: string[];
  endOptions?: string[];
  startYearOptions?: string[];
  endYearOptions?: string[];
  data?: NavType[];
  navData?: NavType[];
  startTitle?: string;
  endTitle?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  embedded?: boolean;
  layout?: 'auto' | 'mobile' | 'desktop';
  variant?: 'paired' | 'stacked-paired';
}
export const DateRangePicker: React.FC<DateRangePickerProps> = React.memo(
  ({
    title,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    startBadgeText,
    endBadgeText,
    startMinDate,
    dateMode = 'date',
    startOptions,
    endOptions,
    startYearOptions,
    endYearOptions,
    startTitle = 'Start',
    endTitle = 'End',
    disabled = false,
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
    variant = 'stacked-paired',
  }) => {
    const today = useMemo(() => getDateAsISO(), []);
    const resolvedStartBadge = startBadgeText || startTitle;
    const resolvedEndBadge = endBadgeText || endTitle;
    const effectiveStartYearOptions = startYearOptions || startOptions || [];
    const effectiveEndYearOptions = endYearOptions || endOptions || [];
    const handleStartYearChange = (val: string) => {
      setStartDate?.(val);
      if (endDate && Number(val) > Number(endDate)) {
        setEndDate?.(val);
      }
    };
    const handleEndYearChange = (val: string) => {
      if (startDate && Number(val) < Number(startDate)) {
        setEndDate?.(startDate);
        return;
      }
      setEndDate?.(val);
    };
    const handleStartDateChange = (val: string) => {
      setStartDate?.(val);
      if (endDate && val && val > endDate) {
        setEndDate?.(val);
      }
    };
    const handleEndDateChange = (val: string) => {
      if (startDate && val && val < startDate) {
        setEndDate?.(startDate);
        return;
      }
      setEndDate?.(val);
    };
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    if (dateMode === 'year') {
      const availableEndOptions = effectiveEndYearOptions.filter(
        (year) => !startDate || Number(year) >= Number(startDate)
      );
      return (
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
                  onChange={(e) => handleStartYearChange(e.target.value)}
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
                  onChange={(e) => handleEndYearChange(e.target.value)}
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
      );
    }
    return (
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
                onChange={(e) => handleStartDateChange(e.target.value)}
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
                onChange={(e) => handleEndDateChange(e.target.value)}
                disabled={disabled}
                aria-label={resolvedEndBadge}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';
export default DateRangePicker;
