import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import JoinedButtonGroup from '../../components/JoinedButtonGroup';
import { ADD_SUB_DATA } from './types';
import { dayOfWeek } from './dateCalcUtils';
import styles from '../DateCalculator.module.scss';
interface DateAddSubInputsProps {
  baseDate: string;
  baseTime: string;
  years: number;
  months: number;
  days: number;
  hours: number;
  addOrSub: 'add' | 'subtract';
  isAddSubInclusive: boolean;
  setBaseDate: (v: string) => void;
  setBaseTime: (v: string) => void;
  setYears: (v: number) => void;
  setMonths: (v: number) => void;
  setDays: (v: number) => void;
  setHours: (v: number) => void;
  setAddOrSub: (v: 'add' | 'subtract') => void;
  setIsAddSubInclusive: (v: boolean) => void;
}
export const DateAddSubInputs: React.FC<DateAddSubInputsProps> = ({
  baseDate,
  baseTime,
  years,
  months,
  days,
  hours,
  addOrSub,
  isAddSubInclusive,
  setBaseDate,
  setBaseTime,
  setYears,
  setMonths,
  setDays,
  setHours,
  setAddOrSub,
  setIsAddSubInclusive,
}) => {
  const durationFields = [
    { label: 'Years', max: 1000, value: years, onChange: setYears },
    { label: 'Months', max: 12000, value: months, onChange: setMonths },
    { label: 'Days', max: 365000, value: days, onChange: setDays },
    { label: 'Hours', max: 8760000, value: hours, onChange: setHours },
  ];
  return (
    <div className={styles.inputsCol}>
      <ValuePicker
        variant="paired"
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
        {durationFields.map((field) => (
          <div key={field.label} className={styles.durationCol}>
            <label className={styles.durationLabel}>{field.label}</label>
            <input
              className={styles.durationInput}
              type="number"
              min="0"
              max={field.max}
              value={field.value || ''}
              placeholder="0"
              onChange={(e) =>
                field.onChange(Math.min(field.max, Math.max(0, Number(e.target.value) || 0)))
              }
            />
          </div>
        ))}
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
  );
};
