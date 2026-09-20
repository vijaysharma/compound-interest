import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import { dayOfWeek } from './dateCalcUtils';
import styles from '../DateCalculator.module.scss';
interface DateDifferenceInputsProps {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  isInclusive: boolean;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onStartTimeChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
  onInclusiveChange: (val: boolean) => void;
}
export const DateDifferenceInputs: React.FC<DateDifferenceInputsProps> = ({
  startDate,
  startTime,
  endDate,
  endTime,
  isInclusive,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onInclusiveChange,
}) => {
  return (
    <div className={styles.inputsCol}>
      <div className={styles.inputsRow}>
        <div className={styles.inputCol}>
          <ValuePicker
            variant="paired"
            sourceBadgeText="From"
            targetBadgeText="Time"
            sourceSlot={(
              <input
                className={styles.plainInput}
                type="date"
                max={endDate || undefined}
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                aria-label="From Date"
              />
            )}
            targetSlot={(
              <input
                className={styles.plainInput}
                type="time"
                value={startTime}
                onChange={(e) => onStartTimeChange(e.target.value)}
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
          <ValuePicker
            variant="paired"
            sourceBadgeText="To"
            targetBadgeText="Time"
            sourceSlot={(
              <input
                className={styles.plainInput}
                type="date"
                min={startDate || undefined}
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                aria-label="To Date"
              />
            )}
            targetSlot={(
              <input
                className={styles.plainInput}
                type="time"
                value={endTime}
                onChange={(e) => onEndTimeChange(e.target.value)}
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
          onChange={(e) => onInclusiveChange(e.target.checked)}
          className={styles.toggleSwitch}
        />
      </label>
    </div>
  );
};
