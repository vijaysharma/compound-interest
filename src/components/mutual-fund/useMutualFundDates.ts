import { useState } from 'react';
import { navDateToISO } from '../../utilities/utility';
import { getTodayISO } from '../../utilities/dateGuards';
import type { NavType } from '../../types/types';
export function useMutualFundDates(
  initialStart: string | null = null,
  initialEnd: string | null = null,
  initialDuration = '1',
  initialShowDate = true
) {
  const [startDate, setStartDate] = useState<string | null>(initialStart);
  const [endDate, setEndDate] = useState<string | null>(initialEnd);
  const [duration, setDuration] = useState<string>(initialDuration);
  const [showDate, setShowDate] = useState<boolean>(initialShowDate);
  const toggleShowDate = () => setShowDate((prev) => !prev);
  const handleDurationChange = (value: string, jsonNavData: NavType[]) => {
    setDuration(value);
    if (jsonNavData.length === 0) return;
    const durationIndex = Math.max(parseInt(value, 10) || 1, 0);
    const index = Math.min(durationIndex, jsonNavData.length - 1);
    const start = jsonNavData[index];
    const end = jsonNavData[0];
    if (start) setStartDate(navDateToISO(start.date));
    if (end) setEndDate(navDateToISO(end.date));
  };
  const handleStartDateChange = (val: string | null) => {
    if (!val) { setStartDate(null); return; }
    setStartDate(val);
    if (endDate && val > endDate) setEndDate(val);
  };
  const handleEndDateChange = (val: string | null) => {
    if (!val) { setEndDate(null); return; }
    const today = getTodayISO();
    const safeVal = val > today ? today : val;
    setEndDate(safeVal);
    if (startDate && startDate > safeVal) setStartDate(safeVal);
  };
  const alignInitialDates = (jsonNavData: NavType[]) => {
    if (jsonNavData.length === 0 || startDate || endDate) return;
    const durationIndex = Math.max(parseInt(duration, 10) || 1, 0);
    const index = Math.min(durationIndex, jsonNavData.length - 1);
    const start = jsonNavData[index];
    const end = jsonNavData[0];
    if (start) setStartDate(navDateToISO(start.date));
    if (end) setEndDate(navDateToISO(end.date));
  };
  const [prevInitialStart, setPrevInitialStart] = useState(initialStart);
  const [prevInitialEnd, setPrevInitialEnd] = useState(initialEnd);
  if (initialStart !== prevInitialStart) {
    setPrevInitialStart(initialStart);
    setStartDate(initialStart);
  }
  if (initialEnd !== prevInitialEnd) {
    setPrevInitialEnd(initialEnd);
    setEndDate(initialEnd);
  }
  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    duration,
    setDuration,
    showDate,
    setShowDate,
    toggleShowDate,
    handleDurationChange,
    handleStartDateChange,
    handleEndDateChange,
    alignInitialDates,
  };
}
