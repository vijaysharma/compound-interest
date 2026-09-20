import React from 'react';
import { formatDateTime, dayOfWeek } from './dateCalcUtils';
import styles from '../DateCalculator.module.scss';
interface DateAddSubResultsProps {
  resultDate: Date | null;
  baseDate: string;
  baseTime: string;
  years: number;
  months: number;
  days: number;
  hours: number;
  addOrSub: 'add' | 'subtract';
  isAddSubInclusive: boolean;
}
export const DateAddSubResults: React.FC<DateAddSubResultsProps> = ({
  resultDate,
  baseDate,
  baseTime,
  years,
  months,
  days,
  hours,
  addOrSub,
  isAddSubInclusive,
}) => {
  if (!resultDate) return <div className={styles.resultsCol} />;
  const durationStr = [
    years > 0 ? `${years}y` : '',
    months > 0 ? `${months}m` : '',
    days > 0 ? `${days}d` : '',
    hours > 0 ? `${hours}h` : '',
  ]
    .filter(Boolean)
    .join(' ') || '0d';
  const baseDateFormatted = new Date(`${baseDate}T${baseTime || '00:00'}`).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
  return (
    <div className={styles.resultsCol}>
      <div className={styles.resultCard}>
        <p className={styles.resultTag}>
          Resulting Date &amp; Time {isAddSubInclusive ? '(Inclusive)' : ''}
        </p>
        <p className={styles.resultDate}>{formatDateTime(resultDate, baseTime, hours)}</p>
        <p className={styles.resultDetail}>
          {addOrSub === 'add' ? 'Added' : 'Subtracted'} {durationStr}{' '}
          {addOrSub === 'add' ? 'to' : 'from'} {dayOfWeek(baseDate)}, {baseDateFormatted}
          {baseTime !== '00:00' ? ` at ${baseTime}` : ''}
          {isAddSubInclusive ? ' (counting starting date as Day 1)' : ''}
        </p>
      </div>
    </div>
  );
};
