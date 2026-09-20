'use client';
import React from 'react';
import SEOHead from '../components/SEOHead';
import JoinedButtonGroup from '../components/JoinedButtonGroup';
import { MODE_DATA } from './date-calculator/types';
import { useDateCalculatorState } from './date-calculator/useDateCalculatorState';
import { DateCalculatorHeader } from './date-calculator/DateCalculatorHeader';
import { DateDifferenceInputs } from './date-calculator/DateDifferenceInputs';
import { DateDifferenceResults } from './date-calculator/DateDifferenceResults';
import { DateAddSubInputs } from './date-calculator/DateAddSubInputs';
import { DateAddSubResults } from './date-calculator/DateAddSubResults';
import styles from './DateCalculator.module.scss';
const DateCalculator: React.FC = () => {
  const {
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
  } = useDateCalculatorState();
  return (
    <main className={styles.container}>
      <SEOHead
        title="Date & Time Calculator — Days & Hours Difference, Add/Subtract"
        description="Free date and time calculator to find the number of days, hours, weeks, months, and years between two dates/times, or add/subtract days and hours."
        keywords="date calculator, days between dates, hours between dates, date difference calculator, add hours to date, subtract hours from date, date duration calculator"
        canonicalPath="/date-calculator"
        noIndex={false}
      />
      <DateCalculatorHeader />
      <JoinedButtonGroup
        data={MODE_DATA}
        selectedValue={mode}
        updateSelectedValue={(v: string) => setMode(v as 'difference' | 'add-subtract')}
        sizePrefix="sm"
      />
      {mode === 'difference' ? (
        <div className={styles.calculatorGrid}>
          <DateDifferenceInputs
            startDate={startDate}
            startTime={startTime}
            endDate={endDate}
            endTime={endTime}
            isInclusive={isInclusive}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onInclusiveChange={setIsInclusive}
          />
          <DateDifferenceResults diff={diff} isInclusive={isInclusive} />
        </div>
      ) : (
        <div className={styles.calculatorGrid}>
          <DateAddSubInputs
            baseDate={baseDate}
            baseTime={baseTime}
            years={years}
            months={months}
            days={days}
            hours={hours}
            addOrSub={addOrSub}
            isAddSubInclusive={isAddSubInclusive}
            setBaseDate={setBaseDate}
            setBaseTime={setBaseTime}
            setYears={setYears}
            setMonths={setMonths}
            setDays={setDays}
            setHours={setHours}
            setAddOrSub={setAddOrSub}
            setIsAddSubInclusive={setIsAddSubInclusive}
          />
          <DateAddSubResults
            resultDate={resultDate}
            baseDate={baseDate}
            baseTime={baseTime}
            years={years}
            months={months}
            days={days}
            hours={hours}
            addOrSub={addOrSub}
            isAddSubInclusive={isAddSubInclusive}
          />
        </div>
      )}
    </main>
  );
};
export default DateCalculator;
