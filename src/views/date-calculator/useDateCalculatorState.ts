import { useState, useMemo, useCallback } from 'react';
import {
  DateMode,
  SavedDateState,
  getDefaultDateState,
  getTodayISO,
} from './types';
import { calculateDateDiff, calculateAddSubDate } from './dateCalcUtils';
import { useDateCalculatorStorage } from './useDateCalculatorStorage';
export function useDateCalculatorState() {
  const defaultState = useMemo(() => getDefaultDateState(getTodayISO()), []);
  const [mode, setMode] = useState<DateMode>(defaultState.mode);
  // Difference mode state
  const [startDate, setStartDate] = useState(defaultState.startDate);
  const [startTime, setStartTime] = useState(defaultState.startTime);
  const [endDate, setEndDate] = useState(defaultState.endDate);
  const [endTime, setEndTime] = useState(defaultState.endTime);
  const [isInclusive, setIsInclusive] = useState(defaultState.isInclusive);
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && endDate && newStart > endDate) {
      setEndDate(newStart);
    }
  };
  const handleEndDateChange = (newEnd: string) => {
    if (newEnd && startDate && newEnd < startDate) {
      setEndDate(startDate);
      return;
    }
    setEndDate(newEnd);
  };
  // Add/Subtract mode state
  const [baseDate, setBaseDate] = useState(defaultState.baseDate);
  const [baseTime, setBaseTime] = useState(defaultState.baseTime);
  const [years, setYears] = useState(defaultState.years);
  const [months, setMonths] = useState(defaultState.months);
  const [days, setDays] = useState(defaultState.days);
  const [hours, setHours] = useState(defaultState.hours);
  const [addOrSub, setAddOrSub] = useState<'add' | 'subtract'>(defaultState.addOrSub);
  const [isAddSubInclusive, setIsAddSubInclusive] = useState(defaultState.isAddSubInclusive);
  const handleRestore = useCallback((saved: SavedDateState) => {
    setMode(saved.mode);
    setStartDate(saved.startDate);
    setStartTime(saved.startTime);
    setEndDate(saved.endDate);
    setEndTime(saved.endTime);
    setIsInclusive(saved.isInclusive);
    setBaseDate(saved.baseDate);
    setBaseTime(saved.baseTime);
    setYears(saved.years);
    setMonths(saved.months);
    setDays(saved.days);
    setHours(saved.hours);
    setAddOrSub(saved.addOrSub);
    setIsAddSubInclusive(saved.isAddSubInclusive);
  }, []);
  useDateCalculatorStorage(
    {
      mode,
      startDate,
      startTime,
      endDate,
      endTime,
      isInclusive,
      baseDate,
      baseTime,
      years,
      months,
      days,
      hours,
      addOrSub,
      isAddSubInclusive,
    },
    handleRestore
  );
  const diff = useMemo(
    () => calculateDateDiff(startDate, startTime, endDate, endTime, isInclusive),
    [startDate, startTime, endDate, endTime, isInclusive]
  );
  const resultDate = useMemo(
    () =>
      calculateAddSubDate(
        baseDate,
        baseTime,
        years,
        months,
        days,
        hours,
        addOrSub,
        isAddSubInclusive
      ),
    [baseDate, baseTime, years, months, days, hours, addOrSub, isAddSubInclusive]
  );
  return {
    mode,
    setMode,
    startDate,
    startTime,
    endDate,
    endTime,
    isInclusive,
    setIsInclusive,
    setStartTime,
    setEndTime,
    handleStartDateChange,
    handleEndDateChange,
    diff,
    baseDate,
    setBaseDate,
    baseTime,
    setBaseTime,
    years,
    setYears,
    months,
    setMonths,
    days,
    setDays,
    hours,
    setHours,
    addOrSub,
    setAddOrSub,
    isAddSubInclusive,
    setIsAddSubInclusive,
    resultDate,
  };
}
