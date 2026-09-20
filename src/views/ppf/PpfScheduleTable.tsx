import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { getCurrencySymbol } from '../../utilities/currency';
import type { PPFYearDetail } from '../../utilities/ppfCalculations';
import styles from '../PpfCalculator.module.scss';
interface PpfScheduleTableProps {
  yearlyBreakdown: PPFYearDetail[];
  expandedYear: number | null;
  setExpandedYear: React.Dispatch<React.SetStateAction<number | null>>;
}
export function PpfScheduleTable({
  yearlyBreakdown, expandedYear, setExpandedYear,
}: PpfScheduleTableProps) {
  const currencySymbol = getCurrencySymbol('en-IN', 'INR');
  return (
    <section className={styles.scheduleSection}>
      <div>
        <div className={styles.scheduleHeader}>
          <div>
            <h2 className={`${styles.sectionHeading} ${styles.subheading}`}>
              Year-by-Year PPF Growth Schedule
            </h2>
            <p className={`${styles.subtitle} ${styles.subheadingDesc}`}>
              Shows actual historical rates declared by the Ministry of Finance vs forward projected rates.
            </p>
          </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Year</th>
                <th>Financial Year</th>
                <th>Interest Rate</th>
                <th>Opening Balance</th>
                <th>Deposits</th>
                <th>Interest (Credited Mar 31)</th>
                <th>Closing Balance</th>
                <th>Monthly Breakdown</th>
              </tr>
            </thead>
            <tbody>
              {yearlyBreakdown.map((row) => {
                const isExpanded = expandedYear === row.yearNumber;
                return (
                  <React.Fragment key={row.yearNumber}>
                    <tr>
                      <td>
                        <strong>Yr {row.yearNumber}</strong>
                        {row.isExtensionYear && <span className={styles.extBadge}>(Ext)</span>}
                      </td>
                      <td>FY {row.fyLabel}</td>
                      <td>
                        <span
                          className={`${styles.rateBadge} ${
                            row.isHistorical ? styles.rateBadgeHistorical : styles.rateBadgeProjected
                          }`}
                        >
                          {row.interestRate}% {row.isHistorical ? 'Historical' : 'Projected'}
                        </span>
                      </td>
                      <td>{currencySymbol}{row.openingBalance.toLocaleString('en-IN')}</td>
                      <td>{currencySymbol}{row.annualDeposit.toLocaleString('en-IN')}</td>
                      <td className={styles.interestCell}>
                        +{currencySymbol}{row.totalInterest.toLocaleString('en-IN')}
                      </td>
                      <td className={styles.balanceCell}>
                        {currencySymbol}{row.closingBalance.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.expandBtn}
                          onClick={() => setExpandedYear(isExpanded ? null : row.yearNumber)}
                        >
                          {isExpanded ? (
                            <>Hide <FiChevronUp /></>
                          ) : (
                            <>View 12 Months <FiChevronDown /></>
                          )}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className={styles.monthExpandCell}>
                          <div className={styles.monthTableWrapper}>
                            <div className={styles.monthTableHeading}>
                              Month-by-Month Interest Breakdown for FY {row.fyLabel} (Rate: {row.interestRate}%)
                            </div>
                            <table className={styles.monthTable}>
                              <thead>
                                <tr>
                                  <th>Month</th>
                                  <th>Deposit</th>
                                  <th>Eligible Balance (Lowest 5th-30th)</th>
                                  <th>Monthly Interest Accrued</th>
                                  <th>Running Balance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {row.months.map((m) => (
                                  <tr key={m.monthIndex}>
                                    <td>{m.monthName}</td>
                                    <td>{currencySymbol}{m.deposit.toLocaleString('en-IN')}</td>
                                    <td>{currencySymbol}{m.eligibleBalanceForInterest.toLocaleString('en-IN')}</td>
                                    <td className={styles.monthCellInterest}>
                                      +{currencySymbol}{m.monthlyInterest.toLocaleString('en-IN')}
                                    </td>
                                    <td>{currencySymbol}{m.closingBalance.toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
