import { DateDiffResult } from './types';
export const dayOfWeek = (dateStr: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
};
export const formatDateTime = (d: Date, baseTime: string, hours: number): string => {
  const dateFormatted = d.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  if (baseTime !== '00:00' || hours > 0) {
    const timeFormatted = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateFormatted} at ${timeFormatted}`;
  }
  return dateFormatted;
};
export function calculateDateDiff(
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  isInclusive: boolean
): DateDiffResult | null {
  if (!startDate || !endDate) return null;
  const s = new Date(`${startDate}T${startTime || '00:00'}`);
  const e = new Date(`${endDate}T${endTime || '00:00'}`);
  let totalMs = Math.abs(e.getTime() - s.getTime());
  if (isInclusive) {
    totalMs += 24 * 60 * 60 * 1000;
  }
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
  const totalWeeks = Math.floor(totalDays / 7);
  const remainingDaysAfterWeeks = totalDays % 7;
  // Calculate year/month/day/hour breakdown
  const earlier = s <= e ? new Date(s) : new Date(e);
  const later = s <= e ? new Date(e) : new Date(s);
  if (isInclusive) {
    later.setDate(later.getDate() + 1);
  }
  let diffYears = later.getFullYear() - earlier.getFullYear();
  let diffMonths = later.getMonth() - earlier.getMonth();
  let diffDays = later.getDate() - earlier.getDate();
  let diffHours = later.getHours() - earlier.getHours();
  let diffMinutes = later.getMinutes() - earlier.getMinutes();
  if (diffMinutes < 0) {
    diffMinutes += 60;
    diffHours--;
  }
  if (diffHours < 0) {
    diffHours += 24;
    diffDays--;
  }
  if (diffDays < 0) {
    diffMonths--;
    const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
    diffDays += prevMonth.getDate();
  }
  if (diffMonths < 0) {
    diffYears--;
    diffMonths += 12;
  }
  return {
    totalDays,
    totalHours,
    totalWeeks,
    remainingDaysAfterWeeks,
    years: diffYears,
    months: diffMonths,
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    isPast: e < s,
    isInclusive,
  };
}
export function calculateAddSubDate(
  baseDate: string,
  baseTime: string,
  years: number,
  months: number,
  days: number,
  hours: number,
  addOrSub: 'add' | 'subtract',
  isAddSubInclusive: boolean
): Date | null {
  if (!baseDate) return null;
  const time = baseTime || '00:00';
  const [h, m] = time.split(':').map((val) => parseInt(val, 10) || 0);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  const hasDuration = years > 0 || months > 0 || days > 0 || hours > 0;
  if (addOrSub === 'add') {
    d.setFullYear(d.getFullYear() + years);
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    if (isAddSubInclusive && hasDuration) {
      d.setDate(d.getDate() - 1);
    }
  } else {
    d.setFullYear(d.getFullYear() - years);
    d.setMonth(d.getMonth() - months);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    if (isAddSubInclusive && hasDuration) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}
