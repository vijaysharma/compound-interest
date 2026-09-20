import React from 'react';
import DisplayCard from '../../components/DisplayCard';
import { DateDiffResult } from './types';
import styles from '../DateCalculator.module.scss';
interface DateDifferenceResultsProps {
  diff: DateDiffResult | null;
  isInclusive: boolean;
}
export const DateDifferenceResults: React.FC<DateDifferenceResultsProps> = ({
  diff,
  isInclusive,
}) => {
  if (!diff) return <div className={styles.resultsCol} />;
  return (
    <div className={styles.resultsCol}>
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
    </div>
  );
};
