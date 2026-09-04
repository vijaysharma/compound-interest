import React, { useState, useMemo, useEffect } from 'react';
import SEOHead from '../components/SEOHead.tsx';
import JoinedButtonGroup from '../components/JoinedButtonGroup.tsx';
import DisplayCard from '../components/DisplayCard.tsx';
type DateMode = 'difference' | 'add-subtract';
const MODE_DATA = [
  { id: 'diff', value: 'difference', title: 'Date Difference' },
  { id: 'add-sub', value: 'add-subtract', title: 'Add / Subtract' },
];
const ADD_SUB_DATA = [
  { id: 'add', value: 'add', title: 'Add' },
  { id: 'subtract', value: 'subtract', title: 'Subtract' },
];
const getTodayISO = () => new Date().toISOString().split('T')[0];
const STORAGE_KEY = 'date_calculator_state';
interface SavedDateState {
  mode: DateMode;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isInclusive: boolean;
  baseDate: string;
  baseTime: string;
  years: number;
  months: number;
  days: number;
  hours: number;
  addOrSub: 'add' | 'subtract';
  isAddSubInclusive: boolean;
}
const getSavedDateState = (): SavedDateState => {
  const today = getTodayISO();
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
  return {
    mode: 'difference',
    startDate: today,
    startTime: '00:00',
    endDate: today,
    endTime: '00:00',
    isInclusive: false,
    baseDate: today,
    baseTime: '00:00',
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    addOrSub: 'add',
    isAddSubInclusive: false,
  };
};
const DateCalculator: React.FC = () => {
  const [saved] = useState<SavedDateState>(getSavedDateState);
  const [mode, setMode] = useState<DateMode>(saved.mode);
  // Difference mode state
  const [startDate, setStartDate] = useState(saved.startDate);
  const [startTime, setStartTime] = useState(saved.startTime);
  const [endDate, setEndDate] = useState(saved.endDate);
  const [endTime, setEndTime] = useState(saved.endTime);
  const [isInclusive, setIsInclusive] = useState(saved.isInclusive);
  // Add/Subtract mode state
  const [baseDate, setBaseDate] = useState(saved.baseDate);
  const [baseTime, setBaseTime] = useState(saved.baseTime);
  const [years, setYears] = useState(saved.years);
  const [months, setMonths] = useState(saved.months);
  const [days, setDays] = useState(saved.days);
  const [hours, setHours] = useState(saved.hours);
  const [addOrSub, setAddOrSub] = useState<'add' | 'subtract'>(saved.addOrSub);
  const [isAddSubInclusive, setIsAddSubInclusive] = useState(saved.isAddSubInclusive);
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
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
        })
      );
    } catch (err) {
      console.warn('Failed to persist date calculator state:', err);
    }
  }, [
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
  ]);
  // Difference calculation
  const diff = useMemo(() => {
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
  }, [startDate, startTime, endDate, endTime, isInclusive]);
  // Add/Subtract calculation
  const resultDate = useMemo(() => {
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
  }, [baseDate, baseTime, years, months, days, hours, addOrSub, isAddSubInclusive]);
  const formatDateTime = (d: Date) => {
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
  const dayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
  };
  const numberInputBase =
    'input input-bordered input-primary input-sm text-center w-full font-semibold';
  return (
    <main className="w-full max-w-lg mx-auto px-2 py-4 space-y-4">
      <SEOHead
        title="Date & Time Calculator — Days & Hours Difference, Add/Subtract"
        description="Free date and time calculator to find the number of days, hours, weeks, months, and years between two dates/times, or add/subtract days and hours."
        keywords="date calculator, days between dates, hours between dates, date difference calculator, add hours to date, subtract hours from date, date duration calculator"
        canonicalPath="/date-calculator"
        noIndex={false}
      />
      <header className="text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          Date &amp; Time Calculator
        </h1>
        <p className="text-xs opacity-70 mt-1">
          Find the duration in days &amp; hours between dates, or add/subtract time from a date.
        </p>
      </header>
      <JoinedButtonGroup
        data={MODE_DATA}
        selectedValue={mode}
        updateSelectedValue={(v: string) => setMode(v as DateMode)}
        sizePrefix="sm"
      />
      {mode === 'difference' ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-base-100 border border-base-300 rounded-xl p-3 shadow-sm">
                <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
                  From Date &amp; Time
                </label>
                <div className="flex gap-2">
                  <input
                    className="input input-sm input-primary input-bordered grow min-w-0 font-medium"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input
                    className="input input-sm input-primary input-bordered w-24 shrink-0 font-medium text-center"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    title="Start time (defaults to 00:00)"
                  />
                </div>
                {startDate && (
                  <p className="text-[11px] opacity-60 mt-1">
                    {dayOfWeek(startDate)} {startTime ? `@ ${startTime}` : ''}
                  </p>
                )}
              </div>
              <div className="bg-base-100 border border-base-300 rounded-xl p-3 shadow-sm">
                <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
                  To Date &amp; Time
                </label>
                <div className="flex gap-2">
                  <input
                    className="input input-sm input-primary input-bordered grow min-w-0 font-medium"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <input
                    className="input input-sm input-primary input-bordered w-24 shrink-0 font-medium text-center"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    title="End time (defaults to 00:00)"
                  />
                </div>
                {endDate && (
                  <p className="text-[11px] opacity-60 mt-1">
                    {dayOfWeek(endDate)} {endTime ? `@ ${endTime}` : ''}
                  </p>
                )}
              </div>
            </div>
            <label className="flex items-center justify-between bg-base-200/60 border border-base-300 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-base-200 transition-colors">
              <div>
                <span className="text-xs font-semibold block text-base-content">
                  Include both start and end dates (+1 day)
                </span>
                <span className="text-[11px] opacity-60 block">
                  Counts both start and end days as full calendar days
                </span>
              </div>
              <input
                type="checkbox"
                checked={isInclusive}
                onChange={(e) => setIsInclusive(e.target.checked)}
                className="toggle toggle-primary toggle-sm"
              />
            </label>
          </div>
          {diff && (
            <div className="space-y-3">
              <DisplayCard
                primaryAmount={diff.totalDays}
                title={isInclusive ? 'Total Days (Inclusive)' : 'Total Days'}
                secondaryInfo={{
                  title: 'Total Hours',
                  amount: diff.totalHours,
                }}
              />
              <div className="card bg-base-100 border border-base-300 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{diff.years}</p>
                    <p className="text-xs opacity-70">Years</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{diff.months}</p>
                    <p className="text-xs opacity-70">Months</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{diff.days}</p>
                    <p className="text-xs opacity-70">Days</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-primary">{diff.hours}</p>
                    <p className="text-xs opacity-70">Hours</p>
                  </div>
                </div>
                <div className="divider my-0 text-xs opacity-50">or equivalently</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-base-200/60 rounded-lg px-3 py-2 text-center">
                    <span className="font-bold text-lg">{diff.totalWeeks}</span>
                    <span className="text-xs opacity-70 ml-1">weeks</span>
                    {diff.remainingDaysAfterWeeks > 0 && (
                      <span className="text-xs opacity-70"> + {diff.remainingDaysAfterWeeks}d</span>
                    )}
                  </div>
                  <div className="bg-base-200/60 rounded-lg px-3 py-2 text-center">
                    <span className="font-bold text-lg">
                      {diff.totalHours.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs opacity-70 ml-1">total hours</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-base-100 border border-base-300 rounded-xl p-3 shadow-sm">
            <label className="block text-[11px] font-bold opacity-70 mb-1 uppercase tracking-wider">
              Starting Date &amp; Time
            </label>
            <div className="flex gap-2">
              <input
                className="input input-sm input-primary input-bordered grow min-w-0 font-medium"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
              />
              <input
                className="input input-sm input-primary input-bordered w-24 shrink-0 font-medium text-center"
                type="time"
                value={baseTime}
                onChange={(e) => setBaseTime(e.target.value)}
                title="Start time (defaults to 00:00)"
              />
            </div>
            {baseDate && (
              <p className="text-[11px] opacity-60 mt-1">
                {dayOfWeek(baseDate)} {baseTime ? `@ ${baseTime}` : ''}
              </p>
            )}
          </div>
          <JoinedButtonGroup
            data={ADD_SUB_DATA}
            selectedValue={addOrSub}
            updateSelectedValue={(v: string) => setAddOrSub(v as 'add' | 'subtract')}
            sizePrefix="sm"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center">
              <label className="text-xs font-semibold opacity-70">Years</label>
              <input
                className={numberInputBase}
                type="number"
                min="0"
                value={years || ''}
                placeholder="0"
                onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="text-center">
              <label className="text-xs font-semibold opacity-70">Months</label>
              <input
                className={numberInputBase}
                type="number"
                min="0"
                value={months || ''}
                placeholder="0"
                onChange={(e) => setMonths(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="text-center">
              <label className="text-xs font-semibold opacity-70">Days</label>
              <input
                className={numberInputBase}
                type="number"
                min="0"
                value={days || ''}
                placeholder="0"
                onChange={(e) => setDays(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <div className="text-center">
              <label className="text-xs font-semibold opacity-70">Hours</label>
              <input
                className={numberInputBase}
                type="number"
                min="0"
                value={hours || ''}
                placeholder="0"
                onChange={(e) => setHours(Math.max(0, Number(e.target.value)))}
              />
            </div>
          </div>
          <label className="flex items-center justify-between bg-base-200/60 border border-base-300 rounded-xl px-3.5 py-2 cursor-pointer hover:bg-base-200 transition-colors">
            <div>
              <span className="text-xs font-semibold block text-base-content">
                Include start and end days (inclusive count)
              </span>
              <span className="text-[11px] opacity-60 block">
                Counts starting date as Day 1 of the period
              </span>
            </div>
            <input
              type="checkbox"
              checked={isAddSubInclusive}
              onChange={(e) => setIsAddSubInclusive(e.target.checked)}
              className="toggle toggle-primary toggle-sm"
            />
          </label>
          {resultDate && (
            <div className="card bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs uppercase tracking-wider opacity-60 font-semibold">
                Resulting Date &amp; Time {isAddSubInclusive ? '(Inclusive)' : ''}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {formatDateTime(resultDate)}
              </p>
              <p className="text-xs opacity-60">
                {addOrSub === 'add' ? 'Added' : 'Subtracted'}{' '}
                {[
                  years > 0 ? `${years}y` : '',
                  months > 0 ? `${months}m` : '',
                  days > 0 ? `${days}d` : '',
                  hours > 0 ? `${hours}h` : '',
                ]
                  .filter(Boolean)
                  .join(' ') || '0d'}{' '}
                {addOrSub === 'add' ? 'to' : 'from'} {dayOfWeek(baseDate)},{' '}
                {new Date(`${baseDate}T${baseTime || '00:00'}`).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {baseTime !== '00:00' ? ` at ${baseTime}` : ''}
                {isAddSubInclusive ? ' (counting starting date as Day 1)' : ''}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
};
export default DateCalculator;
