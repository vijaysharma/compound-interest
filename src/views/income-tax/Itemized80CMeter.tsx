import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
interface Itemized80CMeterProps {
  itemized80CSum: number;
  effective80CAmount: number;
  currencySymbol: string;
}
export const Itemized80CMeter: React.FC<Itemized80CMeterProps> = ({
  itemized80CSum,
  effective80CAmount,
  currencySymbol,
}) => {
  const percent = Math.min(100, (itemized80CSum / 150000) * 100);
  return (
    <>
      <div className={styles.itemized80CHeader}>
        <div>
          <h3 className={styles.itemized80CTitle}>
            Itemized Section 80C Investment Declaration
          </h3>
          <p className={styles.itemized80CSub}>
            Break down your eligible investments across provident funds, insurance, tuition, and
            principal repayments.
          </p>
        </div>
        <div className={styles.textRight}>
          <span className={styles.fieldHint}>Eligible Deduction Claimed</span>
          <div className={styles.claimed80CValue}>
            {currencySymbol}
            {effective80CAmount.toLocaleString('en-IN')} / ₹1.5L
          </div>
        </div>
      </div>
      <div className={styles.itemized80CMeter}>
        <div className={styles.meterTop}>
          <span>
            Total Declared:{' '}
            <strong>
              {currencySymbol}
              {itemized80CSum.toLocaleString('en-IN')}
            </strong>
          </span>
          <span>{Math.round(percent)}% of ₹1.5L ceiling</span>
        </div>
        <div className={styles.meterFillBar}>
          <div
            className={styles.meterFill}
            ref={(el) => {
              if (el) el.style.width = `${percent}%`;
            }}
          />
        </div>
        {itemized80CSum > 150000 && (
          <div className={styles.itemizedLimitExceeded}>
            Eligible deduction maxed out at statutory limit of ₹1,50,000 (Excess:{' '}
            {currencySymbol}
            {(itemized80CSum - 150000).toLocaleString('en-IN')}).
          </div>
        )}
      </div>
    </>
  );
};
