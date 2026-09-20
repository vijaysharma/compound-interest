import { useEffect, useRef } from 'react';
import {
  STORAGE_KEY,
  SavedDateState,
  getDefaultDateState,
  getTodayISO,
} from './types';
export const getSavedDateState = (): SavedDateState => {
  const today = getTodayISO();
  if (typeof window === 'undefined') {
    return getDefaultDateState(today);
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          mode: parsed.mode === 'add-subtract' ? 'add-subtract' : 'difference',
          startDate: parsed.startDate || today,
          startTime: parsed.startTime ?? '00:00',
          endDate: parsed.endDate || today,
          endTime: parsed.endTime ?? '00:00',
          isInclusive: Boolean(parsed.isInclusive),
          baseDate: parsed.baseDate || today,
          baseTime: parsed.baseTime ?? '00:00',
          years: Number(parsed.years) || 0,
          months: Number(parsed.months) || 0,
          days: Number(parsed.days) || 0,
          hours: Number(parsed.hours) || 0,
          addOrSub: parsed.addOrSub === 'subtract' ? 'subtract' : 'add',
          isAddSubInclusive: Boolean(parsed.isAddSubInclusive),
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load date calculator state:', err);
  }
  return getDefaultDateState(today);
};
export function useDateCalculatorStorage(
  currentState: SavedDateState,
  onRestore: (saved: SavedDateState) => void
) {
  const isLoadedRef = useRef(false);
  useEffect(() => {
    const handleRestore = () => {
      try {
        const saved = getSavedDateState();
        onRestore(saved);
      } catch (err) {
        console.warn('Failed to restore date calculator state:', err);
      } finally {
        isLoadedRef.current = true;
      }
    };
    const id = requestAnimationFrame(handleRestore);
    return () => cancelAnimationFrame(id);
  }, [onRestore]);
  useEffect(() => {
    if (!isLoadedRef.current || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
    } catch (err) {
      console.warn('Failed to persist date calculator state:', err);
    }
  }, [currentState]);
}
