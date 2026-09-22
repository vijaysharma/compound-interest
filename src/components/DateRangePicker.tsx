'use client';
import React, { useMemo } from 'react';
import styles from './PairedPicker.module.scss';
import { pickerRootClass } from './value-picker/chrome';
import { getDateAsISO } from '../utilities/utility';
import type { DateRangePickerProps } from './date-range-picker/types';
import { YearPickerSection } from './date-range-picker/YearPickerSection';
import { SingleDatePickerSection } from './date-range-picker/SingleDatePickerSection';
import { PairedDatePickerSection } from './date-range-picker/PairedDatePickerSection';
export type { DateRangePickerProps };
export const DateRangePicker: React.FC<DateRangePickerProps> = React.memo((props) => {
  const {
    title,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    startMinDate,
    dateMode = 'date',
    startYearOptions = [],
    endYearOptions = [],
    startTitle = 'Start',
    endTitle = 'End',
    disabled = false,
    singleDate = false,
    variant = 'stacked-paired',
  } = props;
  const today = useMemo(() => getDateAsISO(), []);
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
  const rootContainerClass = pickerRootClass(styles, props);
  if (dateMode === 'year') {
    // The end year can never precede the start, so the invalid options are
    // dropped from the dropdown rather than rejected after the fact.
    const selectableEndYears = endYearOptions.filter(
      (year) => !startDate || Number(year) >= Number(startDate)
    );
    return (
      <YearPickerSection
        title={title}
        rootContainerClass={rootContainerClass}
        variant={variant}
        startLabel={startTitle}
        endLabel={endTitle}
        startDate={startDate}
        endDate={endDate}
        disabled={disabled}
        startYearOptions={startYearOptions}
        endYearOptions={selectableEndYears}
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
        startLabel={startTitle}
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
      startLabel={startTitle}
      endLabel={endTitle}
      startMinDate={startMinDate}
      today={today}
      startDate={startDate}
      endDate={endDate}
      disabled={disabled}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
    />
  );
});
DateRangePicker.displayName = 'DateRangePicker';
export default DateRangePicker;
