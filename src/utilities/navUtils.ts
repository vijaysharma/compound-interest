import type { NavType } from '../types/types';
import { parseNavDate, parseAnyDate } from './dateUtils';
interface TimedNav {
  nav: NavType;
  time: number;
}
const sortedNavCache = new WeakMap<NavType[], TimedNav[]>();
const getSortedNavData = (data: NavType[]): TimedNav[] => {
  const cached = sortedNavCache.get(data);
  if (cached) {
    return cached;
  }
  const sorted = data
    .map((nav) => ({ nav, time: parseNavDate(nav.date).getTime() }))
    .filter(({ time }) => Number.isFinite(time))
    .sort((a, b) => a.time - b.time);
  sortedNavCache.set(data, sorted);
  return sorted;
};
/**
 * Find the nearest available NAV on or before
 * the requested calendar date.
 */
export const getNearest = (dateString: string, data: NavType[]): NavType | undefined => {
  if (!dateString || data.length === 0) {
    return undefined;
  }
  const targetDate = parseAnyDate(dateString);
  if (Number.isNaN(targetDate.getTime())) {
    return undefined;
  }
  const sortedData = getSortedNavData(data);
  const targetTime = targetDate.getTime();
  let low = 0;
  let high = sortedData.length - 1;
  let nearestIndex = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (sortedData[middle].time <= targetTime) {
      nearestIndex = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return sortedData[nearestIndex < 0 ? 0 : nearestIndex]?.nav;
};
