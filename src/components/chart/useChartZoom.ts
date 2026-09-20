import { useState, useMemo, useRef, useCallback } from 'react';
import type { ChartDataset, DragState, ZoomRange } from './types';
import { getDateTime, getSortedDates, getMatchedDateRange } from './chartUtils';
const PRESET_DAYS: Record<string, number> = {
  '1M': 30,
  '6M': 180,
  '1Y': 365,
  '3Y': 365 * 3,
  '5Y': 365 * 5,
};
export function useChartZoom(
  datasets: ChartDataset[],
  startDate?: string | null,
  endDate?: string | null,
  enableZoom = true,
  onPresetChange?: (preset: string) => void
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const setContainerRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
  }, []);
  const [userZoom, setUserZoom] = useState<ZoomRange | 'all' | null>(null);
  const [userPreset, setUserPreset] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const matchedKey = `${startDate || ''}:${endDate || ''}`;
  const [prevMatchedKey, setPrevMatchedKey] = useState(matchedKey);
  if (prevMatchedKey !== matchedKey) {
    setPrevMatchedKey(matchedKey);
    setUserZoom(null);
    setUserPreset(null);
  }
  const allSortedDates = useMemo(() => getSortedDates(datasets), [datasets]);
  const matchedRange = useMemo(
    () => getMatchedDateRange(allSortedDates, startDate, endDate),
    [allSortedDates, startDate, endDate]
  );
  const zoomRange = userZoom === 'all' ? null : (userZoom ?? matchedRange);
  const activePreset = userZoom === 'all' ? 'All' : userZoom === null && !matchedRange ? 'All' : userPreset;
  const activeDates = useMemo(() => {
    if (!zoomRange || allSortedDates.length === 0) return allSortedDates;
    const startIdx = allSortedDates.indexOf(zoomRange.start);
    const endIdx = allSortedDates.indexOf(zoomRange.end);
    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return allSortedDates;
    return allSortedDates.slice(startIdx, endIdx + 1);
  }, [allSortedDates, zoomRange]);
  const handleApplyPreset = (preset: string) => {
    setUserPreset(preset);
    onPresetChange?.(preset);
    if (preset === 'All' || allSortedDates.length === 0) {
      setUserZoom('all');
      return;
    }
    const days = PRESET_DAYS[preset];
    if (!days) return;
    const baseEnd = matchedRange?.end || allSortedDates[allSortedDates.length - 1];
    const targetStartTime = getDateTime(baseEnd) - days * 24 * 60 * 60 * 1000;
    let targetIdx = 0;
    for (let i = 0; i < allSortedDates.length; i++) {
      if (getDateTime(allSortedDates[i]) >= targetStartTime) { targetIdx = i; break; }
    }
    const endIdx = allSortedDates.indexOf(baseEnd);
    if (targetIdx <= endIdx && endIdx !== -1) setUserZoom({ start: allSortedDates[targetIdx], end: baseEnd });
  };
  const handleResetZoom = () => {
    setUserZoom(null);
    setUserPreset(null);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom || !containerRef.current || allSortedDates.length < 5) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setDragState({ isDragging: true, startX: x, currentX: x });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverX(x >= 35 && x <= rect.width - 4 ? x : null);
    if (dragState?.isDragging) {
      setDragState((prev) => (prev ? { ...prev, currentX: Math.max(0, Math.min(x, rect.width)) } : null));
    }
  };
  const handleMouseUp = () => {
    if (!dragState?.isDragging || !containerRef.current) {
      setDragState(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const leftPx = Math.min(dragState.startX, dragState.currentX);
    const rightPx = Math.max(dragState.startX, dragState.currentX);
    if (rightPx - leftPx > 15 && activeDates.length > 5) {
      const startIdx = Math.floor(Math.max(0, Math.min(leftPx / rect.width, 1)) * activeDates.length);
      const endIdx = Math.min(activeDates.length - 1, Math.ceil(Math.max(0, Math.min(rightPx / rect.width, 1)) * activeDates.length));
      if (endIdx - startIdx >= 2) {
        setUserZoom({ start: activeDates[startIdx], end: activeDates[endIdx] });
        setUserPreset(null);
      }
    }
    setDragState(null);
  };
  const handleMouseLeave = () => {
    setHoverX(null);
    if (dragState?.isDragging) handleMouseUp();
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    setHoverX(x >= 35 && x <= rect.width - 4 ? x : null);
  };
  const handleTouchEnd = () => setHoverX(null);
  return {
    setContainerRef,
    dragState,
    hoverX,
    allSortedDates,
    activeDates,
    zoomRange,
    activePreset,
    handleApplyPreset,
    handleResetZoom,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchMove,
    handleTouchEnd,
  };
}
