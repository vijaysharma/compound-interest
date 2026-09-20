import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
interface InterestTabProps {
  ppfInterest: string;
  setPpfInterest: (val: string) => void;
  savingsInterest: string;
  setSavingsInterest: (val: string) => void;
  fdInterest: string;
  setFdInterest: (val: string) => void;
  otherIncome: string;
  setOtherIncome: (val: string) => void;
}
export const InterestTab: React.FC<InterestTabProps> = ({
  ppfInterest,
  setPpfInterest,
  savingsInterest,
  setSavingsInterest,
  fdInterest,
  setFdInterest,
  otherIncome,
  setOtherIncome,
}) => {
  return (
    <div className={styles.formGrid2}>
      <div className={styles.formField}>
        <label htmlFor="tax-ppf-interest" className={styles.label}>
          Annual PPF Interest Earned
          <span className={styles.exemptBadge}>100% Tax-Exempt (EEE)</span>
        </label>
        <input
          id="tax-ppf-interest"
          type="text"
          value={ppfInterest}
          onChange={(e) => setPpfInterest(e.target.value)}
          className={styles.input}
        />
        <span className={styles.fieldHintGreen}>
          Completely exempt from tax under Section 10(11) in both Old and New Regimes.
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-savings-interest" className={styles.label}>
          Savings Bank Interest
        </label>
        <input
          id="tax-savings-interest"
          type="text"
          value={savingsInterest}
          onChange={(e) => setSavingsInterest(e.target.value)}
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          Deductible up to ₹10,000 under Section 80TTA (₹50,000 for seniors under 80TTB) in Old Regime.
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-fd-interest" className={styles.label}>
          Fixed Deposit (FD) &amp; Recurring Deposit Interest
        </label>
        <input
          id="tax-fd-interest"
          type="text"
          value={fdInterest}
          onChange={(e) => setFdInterest(e.target.value)}
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          FD interest is fully taxable at your applicable slab rate.
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-other-income" className={styles.label}>
          Other Sources (Dividends, etc.)
        </label>
        <input
          id="tax-other-income"
          type="text"
          value={otherIncome}
          onChange={(e) => setOtherIncome(e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  );
};
