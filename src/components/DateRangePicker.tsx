'use client';
import React, { useMemo } from 'react';
import styles from './PairedPicker.module.scss';
import { getDateAsISO } from '../utilities/utility';
import type { DateRangePickerProps } from './date-range-picker/types';
import { YearPickerSection } from './date-range-picker/YearPickerSection';
import { SingleDatePickerSection } from './date-range-picker/SingleDatePickerSection';
import { PairedDatePickerSection } from './date-range-picker/PairedDatePickerSection';
export type { DateRangePickerProps };
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
    singleDate = false,
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
        <YearPickerSection
          title={title}
          rootContainerClass={rootContainerClass}
          variant={variant}
          resolvedStartBadge={resolvedStartBadge}
          resolvedEndBadge={resolvedEndBadge}
          startDate={startDate}
          endDate={endDate}
          disabled={disabled}
          effectiveStartYearOptions={effectiveStartYearOptions}
          availableEndOptions={availableEndOptions}
          onStartYearChange={handleStartYearChange}
          onEndYearChange={handleEndYearChange}
        />
      );
    }
    const isSingle = singleDate || (!setEndDate && endDate === undefined);
    if (isSingle) {
      return (
        <SingleDatePickerSection
          title={title}
          rootContainerClass={rootContainerClass}
          resolvedStartBadge={resolvedStartBadge}
          startMinDate={startMinDate}
          today={today}
          startDate={startDate}
          disabled={disabled}
          onStartDateChange={handleStartDateChange}
        />
      );
    }
    return (
      <PairedDatePickerSection
        title={title}
        rootContainerClass={rootContainerClass}
        variant={variant}
        resolvedStartBadge={resolvedStartBadge}
        resolvedEndBadge={resolvedEndBadge}
        startMinDate={startMinDate}
        today={today}
        startDate={startDate}
        endDate={endDate}
        disabled={disabled}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />
    );
  }
);
DateRangePicker.displayName = 'DateRangePicker';
export default DateRangePicker;
