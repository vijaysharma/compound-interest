import React from 'react';
import { getCurrencySymbol } from '../../utilities/currency';
import type { NPSYearDetail } from '../../utilities/npsCalculations';
import styles from '../NpsCalculator.module.scss';
interface NpsScheduleTableProps {
  currentAge: number;
  retirementAge: number;
  wealthMultiple: string;
  yearlyBreakdown: NPSYearDetail[];
}
export function NpsScheduleTable({
  currentAge, retirementAge, wealthMultiple, yearlyBreakdown,
}: NpsScheduleTableProps) {
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <section className={styles.scheduleSection}>
      <div>
        <div className={styles.scheduleHeader}>
          <h2 className={`${styles.sectionHeading} ${styles.subheading}`}>
            Retirement Wealth Accumulation Trajectory
          </h2>
          <p className={`${styles.subtitle} ${styles.subheadingDesc}`}>
            Growth of your pension corpus year-by-year from age {currentAge} to {retirementAge} ({wealthMultiple}x Capital Multiplier).
          </p>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Year</th>
                <th>Age</th>
                <th>Annual Contribution</th>
                <th>Total Invested</th>
                <th>Interest Earned This Year</th>
                <th>Closing Pension Corpus</th>
              </tr>
            </thead>
            <tbody>
              {yearlyBreakdown.map((row) => (
                <tr key={row.yearNumber}>
                  <td>Yr {row.yearNumber}</td>
                  <td><strong>{row.age} Yrs</strong></td>
                  <td>{currencySymbol}{row.annualContribution.toLocaleString('en-IN')}</td>
                  <td>{currencySymbol}{row.cumulativeInvested.toLocaleString('en-IN')}</td>
                  <td className={styles.interestCell}>+{currencySymbol}{row.interestEarned.toLocaleString('en-IN')}</td>
                  <td className={styles.balanceCell}>{currencySymbol}{row.closingCorpus.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
