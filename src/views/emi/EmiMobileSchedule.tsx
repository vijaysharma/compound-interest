import React from 'react';
import { ScheduleRow } from './types';
import styles from '../EmiCalculator.module.scss';
interface EmiMobileScheduleProps {
  schedule: ScheduleRow[];
}
export const EmiMobileSchedule: React.FC<EmiMobileScheduleProps> = ({ schedule }) => {
  return (
    <div className={styles.mobileScheduleList}>
      {schedule.map((row, idx) => (
        <article
          key={idx}
          className={`${styles.mobileCard} ${
            row.note?.includes('Part Payment')
              ? styles.mobileCardPartPayment
              : row.note?.includes('ROI Change')
                ? styles.mobileCardRoiChange
                : ''
          }`}
        >
          <div className={styles.mobileCardHeader}>
            <p className={styles.mobileCardTitle}>
              {idx + 1}. {row.date}
            </p>
            {row.note && <span className={styles.badgeWarning}>{row.note}</span>}
          </div>
          <div className={styles.mobileCardGrid}>
            <div>
              <span className={styles.textMuted}>EMI: </span>
              <span className={styles.textPrimary}>
                ₹{parseFloat(row.emi).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className={styles.textMuted}>Balance: </span>
              <span className={styles.textBase}>
                ₹{parseFloat(row.balance).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className={styles.textMuted}>Principal: </span>
              <span className={styles.textEmerald}>
                ₹{parseFloat(row.principal).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className={styles.textMuted}>Interest: </span>
              <span className={styles.textRose}>
                ₹{parseFloat(row.interest).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.mobileCardRowDivided}>
              <span className={styles.textMuted}>Cum. Principal: </span>
              <span className={styles.textEmerald}>
                ₹{parseFloat(row.cumulativePrincipal).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.mobileCardRowDivided}>
              <span className={styles.textMuted}>Cum. Interest: </span>
              <span className={styles.textRose}>
                ₹{parseFloat(row.cumulativeInterest).toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.mobileCardFullWidth}>
              <span className={styles.textMuted}>Remaining Interest: </span>
              <span className={styles.textAmber}>
                ₹{parseFloat(row.remainingInterest).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
