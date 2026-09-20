import type { ChartDataset, ZoomRange } from './types';
export const getDateTime = (date: string): number => {
  const parts = date.split('-');
  if (parts.length !== 3) return Number.NaN;
  if (parts[0].length === 4) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)
      ? new Date(year, month, day).getTime()
      : Number.NaN;
  }
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return Number.NaN;
  return new Date(year, month, day).getTime();
};
export const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
export const formatAxisCurrency = (value: number): string => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (absoluteValue >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (absoluteValue >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
};
export const getTargetHeight = (height?: number | 'auto', minHeight = 350, isMobile = false): number => {
  if (typeof height === 'number') return height;
  return isMobile ? (minHeight > 0 ? Math.min(minHeight, 240) : 240) : (minHeight > 0 ? minHeight : 350);
};
export const getSortedDates = (datasets: ChartDataset[]): string[] => {
  const uniqueDateTimes = new Map<string, number>();
  for (const dataset of datasets) {
    for (const point of dataset.data) {
      if (Number.isFinite(point.nav) && point.nav > 0) {
        const time = getDateTime(point.date);
        if (Number.isFinite(time) && !uniqueDateTimes.has(point.date)) uniqueDateTimes.set(point.date, time);
      }
    }
  }
  return Array.from(uniqueDateTimes.entries()).sort((a, b) => a[1] - b[1]).map(([date]) => date);
};
export const getMatchedDateRange = (allSortedDates: string[], startDate?: string | null, endDate?: string | null): ZoomRange | null => {
  if (allSortedDates.length === 0) return null;
  let startIdx = 0;
  let endIdx = allSortedDates.length - 1;
  if (startDate) {
    const targetStartTime = getDateTime(startDate);
    if (Number.isFinite(targetStartTime)) {
      for (let i = 0; i < allSortedDates.length; i++) {
        if (getDateTime(allSortedDates[i]) >= targetStartTime) { startIdx = i; break; }
      }
    }
  }
  if (endDate) {
    const targetEndTime = getDateTime(endDate);
    if (Number.isFinite(targetEndTime)) {
      for (let i = allSortedDates.length - 1; i >= 0; i--) {
        if (getDateTime(allSortedDates[i]) <= targetEndTime) { endIdx = i; break; }
      }
    }
  }
  return startIdx <= endIdx && (startDate || endDate) ? { start: allSortedDates[startIdx], end: allSortedDates[endIdx] } : null;
};
export const emptySubscribe = () => () => {};
