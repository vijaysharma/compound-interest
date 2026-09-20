import React from 'react';
import { FiCalendar } from 'react-icons/fi';
import styles from '../DateCalculator.module.scss';
export const DateCalculatorHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>
        <FiCalendar className={styles.icon} />
        Date &amp; Time Calculator
      </h2>
      <p className={styles.subtitle}>
        Find the duration in days &amp; hours between dates, or add/subtract time from a date.
      </p>
    </header>
  );
};
