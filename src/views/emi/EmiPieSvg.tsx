import React from 'react';
import { PieSlices } from './emiPieChart';
import styles from '../EmiCalculator.module.scss';
interface EmiPieSvgProps {
  pieSlices: PieSlices;
  principalAmount: number;
  principalPercent: number;
  totalInterest: number;
  interestPercent: number;
}
export const EmiPieSvg: React.FC<EmiPieSvgProps> = ({
  pieSlices,
  principalAmount,
  principalPercent,
  totalInterest,
  interestPercent,
}) => {
  return (
    <div className={styles.pieContainer}>
      <div className={styles.pieSvgWrapper}>
        <svg viewBox="0 0 200 200" className={styles.pieSvg} aria-label="Loan Principal vs Interest Pie Chart">
          {pieSlices?.type === 'full-principal' && (
            <circle cx="100" cy="100" r="85" className={styles.pieSlicePrimary} />
          )}
          {pieSlices?.type === 'full-interest' && (
            <circle cx="100" cy="100" r="85" className={styles.pieSliceError} />
          )}
          {pieSlices?.type === 'slices' && (
            <>
              <path d={pieSlices.principalD} className={styles.pieSlicePrimary}>
                <title>
                  Principal: ₹{Math.round(principalAmount).toLocaleString('en-IN')} ({principalPercent.toFixed(1)}%)
                </title>
              </path>
              <path d={pieSlices.interestD} className={styles.pieSliceError}>
                <title>
                  Interest: ₹{Math.round(totalInterest).toLocaleString('en-IN')} ({interestPercent.toFixed(1)}%)
                </title>
              </path>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};
