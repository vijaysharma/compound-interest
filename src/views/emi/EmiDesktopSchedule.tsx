import React from 'react';
import { ScheduleRow } from './types';
import styles from '../EmiCalculator.module.scss';
interface EmiDesktopScheduleProps {
  schedule: ScheduleRow[];
}
export const EmiDesktopSchedule: React.FC<EmiDesktopScheduleProps> = ({ schedule }) => {
  return (
    <div className={styles.desktopTableWrapper}>
      <table className={styles.table} title="EMI Amortization Schedule">
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Date</th>
            <th className={`${styles.th} ${styles.thRight}`}>EMI</th>
            <th className={`${styles.th} ${styles.thRight}`}>Principal</th>
            <th className={`${styles.th} ${styles.thRight}`}>Interest</th>
            <th className={`${styles.th} ${styles.thRight}`}>Balance</th>
            <th className={`${styles.th} ${styles.thRight} ${styles.textEmerald}`}>
              Cum. Principal
            </th>
            <th className={`${styles.th} ${styles.thRight} ${styles.textRose}`}>
              Cum. Interest
            </th>
            <th className={`${styles.th} ${styles.thRight} ${styles.textAmber}`}>
              Remaining Interest
            </th>
            <th className={styles.th}>Note</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, idx) => (
            <tr
              key={idx}
              className={
                row.note?.includes('Part Payment')
                  ? styles.rowPartPayment
                  : row.note?.includes('ROI Change')
                    ? styles.rowRoiChange
                    : styles.rowNormal
              }
            >
              <td className={`${styles.td} ${styles.tdMono}`}>{row.date}</td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.textPrimary}`}>
                ₹{parseFloat(row.emi).toLocaleString('en-IN')}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.textEmerald}`}>
                ₹{parseFloat(row.principal).toLocaleString('en-IN')}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.textRose}`}>
                ₹{parseFloat(row.interest).toLocaleString('en-IN')}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono}`}>
                ₹{parseFloat(row.balance).toLocaleString('en-IN')}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${styles.textEmerald}`}>
                ₹{parseFloat(row.cumulativePrincipal).toLocaleString('en-IN')}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${styles.textRose}`}>
                ₹{parseFloat(row.cumulativeInterest).toLocaleString('en-IN')}
              </td>
              <td className={`${styles.td} ${styles.tdRight} ${styles.tdMono} ${styles.textAmber}`}>
                ₹{parseFloat(row.remainingInterest).toLocaleString('en-IN')}
              </td>
              <td className={styles.td}>
                {row.note && <span className={styles.badgeOutline}>{row.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
