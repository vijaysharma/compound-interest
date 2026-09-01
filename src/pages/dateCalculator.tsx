import React, { useState, useMemo } from 'react';
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
const DateCalculator: React.FC = () => {
  const [mode, setMode] = useState<DateMode>('difference');
  // Difference mode state
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState(getTodayISO());
  const [isInclusive, setIsInclusive] = useState(false);
  // Add/Subtract mode state
  const [baseDate, setBaseDate] = useState(getTodayISO());
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [days, setDays] = useState(0);
  const [addOrSub, setAddOrSub] = useState<'add' | 'subtract'>('add');
  const [isAddSubInclusive, setIsAddSubInclusive] = useState(false);
  // Difference calculation
  const diff = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const totalMs = Math.abs(e.getTime() - s.getTime());
    let totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
    if (isInclusive) {
      totalDays += 1;
    }
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDaysAfterWeeks = totalDays % 7;
    // Calculate year/month/day breakdown
    const earlier = s <= e ? new Date(s) : new Date(e);
    const later = s <= e ? new Date(e) : new Date(s);
    if (isInclusive) {
      later.setDate(later.getDate() + 1);
    }
    let diffYears = later.getFullYear() - earlier.getFullYear();
    let diffMonths = later.getMonth() - earlier.getMonth();
    let diffDays = later.getDate() - earlier.getDate();
    if (diffDays < 0) {
      diffMonths--;
      // Get last day of the previous month of the later date
      const prevMonth = new Date(later.getFullYear(), later.getMonth(), 0);
      diffDays += prevMonth.getDate();
    }
    if (diffMonths < 0) {
      diffYears--;
      diffMonths += 12;
    }
    return {
      totalDays,
      totalWeeks,
      remainingDaysAfterWeeks,
      years: diffYears,
      months: diffMonths,
      days: diffDays,
      isPast: e < s,
      isInclusive,
    };
  }, [startDate, endDate, isInclusive]);
  // Add/Subtract calculation
  const resultDate = useMemo(() => {
    if (!baseDate) return null;
    const d = new Date(baseDate);
    const hasDuration = years > 0 || months > 0 || days > 0;
    if (addOrSub === 'add') {
      d.setFullYear(d.getFullYear() + years);
      d.setMonth(d.getMonth() + months);
      d.setDate(d.getDate() + days);
      if (isAddSubInclusive && hasDuration) {
        d.setDate(d.getDate() - 1);
      }
    } else {
      d.setFullYear(d.getFullYear() - years);
      d.setMonth(d.getMonth() - months);
      d.setDate(d.getDate() - days);
      if (isAddSubInclusive && hasDuration) {
        d.setDate(d.getDate() + 1);
      }
    }
    return d;
  }, [baseDate, years, months, days, addOrSub, isAddSubInclusive]);
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const dayOfWeek = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long' });
  };
  const numberInputBase = 'input input-bordered input-sm text-center w-full font-semibold';
  return (
    <main className="w-full max-w-lg mx-auto px-2 py-4 space-y-4">
      <SEOHead
        title="Date Calculator — Days Between Dates & Add/Subtract Days"
        description="Free date calculator to find the number of days, weeks, months, and years between two dates with inclusive date options, or add/subtract days, months, and years."
        keywords="date calculator, days between dates, inclusive date calculator, date difference calculator, add days to date, subtract days from date, date duration calculator"
        canonicalPath="/date-calculator"
        noIndex={false}
      />
      <header className="text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Date Calculator</h1>
        <p className="text-xs opacity-70 mt-1">
          Find the duration between dates or add/subtract time from a date.
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
          {/* Date Inputs */}
          <div className="space-y-2">
            <div className="w-full text-center">
              <h5>From &amp; To Dates</h5>
              <div className="join w-full date-picker focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
                <div className="label join-item px-2.5 bg-primary text-primary-content border-primary text-center text-xs font-semibold whitespace-nowrap">
                  From
                </div>
                <input
                  className="join-item input input-sm input-primary grow focus:outline-none text-xs sm:text-sm"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <div className="label join-item px-2.5 bg-primary text-primary-content border-primary text-center text-xs font-semibold whitespace-nowrap">
                  To
                </div>
                <input
                  className="join-item input input-sm input-primary grow focus:outline-none text-xs sm:text-sm"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            {startDate && (
              <p className="text-xs text-center opacity-60">
                {dayOfWeek(startDate)} → {dayOfWeek(endDate)}
              </p>
            )}
            {/* Inclusive Date Option Toggle */}
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
          {/* Results */}
          {diff && (
            <div className="space-y-3">
              <DisplayCard
                primaryAmount={diff.totalDays}
                title={isInclusive ? 'Total Days (Inclusive)' : 'Total Days'}
              />
              <div className="card bg-base-100 border border-base-300 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{diff.years}</p>
                    <p className="text-xs opacity-70">Years</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{diff.months}</p>
                    <p className="text-xs opacity-70">Months</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{diff.days}</p>
                    <p className="text-xs opacity-70">Days</p>
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
                      {(diff.totalDays * 24).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs opacity-70 ml-1">hours</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Base Date */}
          <div className="w-full text-center">
            <h5>Starting Date</h5>
            <div className="join w-full date-picker focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
              <div className="label join-item px-2.5 bg-primary text-primary-content border-primary text-center text-xs font-semibold whitespace-nowrap">
                Date
              </div>
              <input
                className="join-item input input-sm input-primary grow focus:outline-none text-xs sm:text-sm"
                type="date"
                value={baseDate}
                onChange={(e) => setBaseDate(e.target.value)}
              />
            </div>
          </div>
          <JoinedButtonGroup
            data={ADD_SUB_DATA}
            selectedValue={addOrSub}
            updateSelectedValue={(v: string) => setAddOrSub(v as 'add' | 'subtract')}
            sizePrefix="sm"
          />
          {/* Duration Inputs */}
          <div className="grid grid-cols-3 gap-2">
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
          </div>
          {/* Inclusive Date Option Toggle for Add/Subtract */}
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
          {/* Result */}
          {resultDate && (
            <div className="card bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs uppercase tracking-wider opacity-60 font-semibold">
                Resulting Date {isAddSubInclusive ? '(Inclusive)' : ''}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-primary">{formatDate(resultDate)}</p>
              <p className="text-xs opacity-60">
                {addOrSub === 'add' ? 'Added' : 'Subtracted'}{' '}
                {[
                  years > 0 ? `${years}y` : '',
                  months > 0 ? `${months}m` : '',
                  days > 0 ? `${days}d` : '',
                ]
                  .filter(Boolean)
                  .join(' ') || '0d'}{' '}
                {addOrSub === 'add' ? 'to' : 'from'} {dayOfWeek(baseDate)},{' '}
                {new Date(baseDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
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
