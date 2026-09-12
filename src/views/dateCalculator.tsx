'use client';
import React, { useState, useMemo, useEffect } from 'react';
import ValuePicker from '../components/ValuePicker';
import SEOHead from '../components/SEOHead';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import DisplayCard from '../components/DisplayCard';
import { FiCalendar } from 'react-icons/fi';
import styles from './DateCalculator.module.scss';
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
  return (
    <main className={styles.container}>
      <SEOHead
        title="Date & Time Calculator — Days & Hours Difference, Add/Subtract"
        description="Free date and time calculator to find the number of days, hours, weeks, months, and years between two dates/times, or add/subtract days and hours."
        keywords="date calculator, days between dates, hours between dates, date difference calculator, add hours to date, subtract hours from date, date duration calculator"
        canonicalPath="/date-calculator"
        noIndex={false}
      />
      <header className={styles.header}>
        <h2 className={styles.title}>
          <FiCalendar className={styles.icon} />
          Date &amp; Time Calculator
        </h2>
        <p className={styles.subtitle}>
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
        <div className={styles.calculatorGrid}>
          <div className={styles.inputsCol}>
            <div className={styles.inputsRow}>
              <div className={styles.inputCol}>
                <ValuePicker.Paired
                  sourceBadgeText="From"
                  targetBadgeText="Time"
                  sourceSlot={(
                    <input
                      className={styles.plainInput}
                      type="date"
                      max={endDate || undefined}
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      aria-label="From Date"
                    />
                  )}
                  targetSlot={(
                    <input
                      className={styles.plainInput}
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      title="Start time (defaults to 00:00)"
                      aria-label="From Time"
                    />
                  )}
                />
                {startDate && (
                  <p className={styles.helperText}>
                    {dayOfWeek(startDate)} {startTime ? `@ ${startTime}` : ''}
                  </p>
                )}
              </div>
              <div className={styles.inputCol}>
                <ValuePicker.Paired
                  sourceBadgeText="To"
                  targetBadgeText="Time"
                  sourceSlot={(
                    <input
                      className={styles.plainInput}
                      type="date"
                      min={startDate || undefined}
                      value={endDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      aria-label="To Date"
                    />
                  )}
                  targetSlot={(
                    <input
                      className={styles.plainInput}
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      title="End time (defaults to 00:00)"
                      aria-label="To Time"
                    />
                  )}
                />
                {endDate && (
                  <p className={styles.helperText}>
                    {dayOfWeek(endDate)} {endTime ? `@ ${endTime}` : ''}
                  </p>
                )}
              </div>
            </div>
            <label className={styles.toggleCard}>
              <div>
                <span className={styles.toggleTitle}>
                  Include both start and end dates (+1 day)
                </span>
                <span className={styles.toggleDesc}>
                  Counts both start and end days as full calendar days
                </span>
              </div>
              <input
                type="checkbox"
                checked={isInclusive}
                onChange={(e) => setIsInclusive(e.target.checked)}
                className={styles.toggleSwitch}
              />
            </label>
          </div>
          <div className={styles.resultsCol}>
            {diff && (
              <>
                <DisplayCard
                  currencySymbol=""
                  primaryAmount={diff.totalDays}
                  title={isInclusive ? 'Total Days (Inclusive)' : 'Total Days'}
                  secondaryInfo={{
                    title: 'Total Hours',
                    amount: diff.totalHours,
                  }}
                />
                <div className={styles.breakdownGrid}>
                  <div>
                    <p className={styles.breakdownValue}>{diff.years}</p>
                    <p className={styles.breakdownLabel}>Years</p>
                  </div>
                  <div>
                    <p className={styles.breakdownValue}>{diff.months}</p>
                    <p className={styles.breakdownLabel}>Months</p>
                  </div>
                  <div>
                    <p className={styles.breakdownValue}>{diff.days}</p>
                    <p className={styles.breakdownLabel}>Days</p>
                  </div>
                  <div>
                    <p className={styles.breakdownValue}>{diff.hours}</p>
                    <p className={styles.breakdownLabel}>Hours</p>
                  </div>
                </div>
                <div className={styles.divider}>
                  <span>or equivalently</span>
                </div>
                <div className={styles.weeksGrid}>
                  <div className={styles.weeksCard}>
                    <span className={styles.weeksAmount}>{diff.totalWeeks}</span>
                    <span className={styles.weeksUnit}>weeks</span>
                    {diff.remainingDaysAfterWeeks > 0 && (
                      <span className={styles.weeksUnit}> + {diff.remainingDaysAfterWeeks}d</span>
                    )}
                  </div>
                  <div className={styles.weeksCard}>
                    <span className={styles.weeksAmount}>
                      {diff.totalHours.toLocaleString('en-IN')}
                    </span>
                    <span className={styles.weeksUnit}>total hours</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.calculatorGrid}>
          <div className={styles.inputsCol}>
            <ValuePicker.Paired
              title="Starting Date & Time"
              sourceBadgeText="Date"
              targetBadgeText="Time"
              sourceSlot={(
                <input
                  className={styles.plainInput}
                  type="date"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                  aria-label="Starting Date"
                />
              )}
              targetSlot={(
                <input
                  className={styles.plainInput}
                  type="time"
                  value={baseTime}
                  onChange={(e) => setBaseTime(e.target.value)}
                  title="Start time (defaults to 00:00)"
                  aria-label="Starting Time"
                />
              )}
            />
            {baseDate && (
              <p className={styles.helperText}>
                {dayOfWeek(baseDate)} {baseTime ? `@ ${baseTime}` : ''}
              </p>
            )}
            <JoinedButtonGroup
              data={ADD_SUB_DATA}
              selectedValue={addOrSub}
              updateSelectedValue={(v: string) => setAddOrSub(v as 'add' | 'subtract')}
              sizePrefix="sm"
            />
            <div className={styles.durationGrid}>
              <div className={styles.durationCol}>
                <label className={styles.durationLabel}>Years</label>
                <input
                  className={styles.durationInput}
                  type="number"
                  min="0"
                  max="1000"
                  value={years || ''}
                  placeholder="0"
                  onChange={(e) => setYears(Math.min(1000, Math.max(0, Number(e.target.value) || 0)))}
                />
              </div>
              <div className={styles.durationCol}>
                <label className={styles.durationLabel}>Months</label>
                <input
                  className={styles.durationInput}
                  type="number"
                  min="0"
                  max="12000"
                  value={months || ''}
                  placeholder="0"
                  onChange={(e) => setMonths(Math.min(12000, Math.max(0, Number(e.target.value) || 0)))}
                />
              </div>
              <div className={styles.durationCol}>
                <label className={styles.durationLabel}>Days</label>
                <input
                  className={styles.durationInput}
                  type="number"
                  min="0"
                  max="365000"
                  value={days || ''}
                  placeholder="0"
                  onChange={(e) => setDays(Math.min(365000, Math.max(0, Number(e.target.value) || 0)))}
                />
              </div>
              <div className={styles.durationCol}>
                <label className={styles.durationLabel}>Hours</label>
                <input
                  className={styles.durationInput}
                  type="number"
                  min="0"
                  max="8760000"
                  value={hours || ''}
                  placeholder="0"
                  onChange={(e) => setHours(Math.min(8760000, Math.max(0, Number(e.target.value) || 0)))}
                />
              </div>
            </div>
            <label className={styles.toggleCard}>
              <div>
                <span className={styles.toggleTitle}>
                  Include start and end days (inclusive count)
                </span>
                <span className={styles.toggleDesc}>
                  Counts starting date as Day 1 of the period
                </span>
              </div>
              <input
                type="checkbox"
                checked={isAddSubInclusive}
                onChange={(e) => setIsAddSubInclusive(e.target.checked)}
                className={styles.toggleSwitch}
              />
            </label>
          </div>
          <div className={styles.resultsCol}>
            {resultDate && (
              <div className={styles.resultCard}>
                <p className={styles.resultTag}>
                  Resulting Date &amp; Time {isAddSubInclusive ? '(Inclusive)' : ''}
                </p>
                <p className={styles.resultDate}>
                  {formatDateTime(resultDate)}
                </p>
                <p className={styles.resultDetail}>
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
        </div>
      )}
    </main>
  );
};
export default DateCalculator;
