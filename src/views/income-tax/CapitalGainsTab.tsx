import React from 'react';
import styles from '../IncomeTaxCalculator.module.scss';
interface CapitalGainsTabProps {
  equityStcg: string;
  setEquityStcg: (val: string) => void;
  equityLtcg: string;
  setEquityLtcg: (val: string) => void;
  otherCapitalGains: string;
  setOtherCapitalGains: (val: string) => void;
}
export const CapitalGainsTab: React.FC<CapitalGainsTabProps> = ({
  equityStcg,
  setEquityStcg,
  equityLtcg,
  setEquityLtcg,
  otherCapitalGains,
  setOtherCapitalGains,
}) => {
  return (
    <div className={styles.formGrid2}>
      <div className={styles.formField}>
        <label htmlFor="tax-equity-stcg" className={styles.label}>
          Equity Short-Term Capital Gains (STCG)
          <span className={styles.fieldBadgeAmber}>(Taxed at 20%)</span>
        </label>
        <input
          id="tax-equity-stcg"
          type="text"
          value={equityStcg}
          onChange={(e) => setEquityStcg(e.target.value)}
          placeholder="Shares / Equity MF held < 1 year"
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          Budget 2024 revised STCG rate to 20% under Section 111A.
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-equity-ltcg" className={styles.label}>
          Equity Long-Term Capital Gains (LTCG)
          <span className={styles.fieldBadgeGreen}>(₹1.25L Exempt, 12.5% above)</span>
        </label>
        <input
          id="tax-equity-ltcg"
          type="text"
          value={equityLtcg}
          onChange={(e) => setEquityLtcg(e.target.value)}
          placeholder="Shares / Equity MF held > 1 year"
          className={styles.input}
        />
        <span className={styles.fieldHint}>
          First ₹1,25,000 is 100% tax-free under Section 112A.
        </span>
      </div>
      <div className={styles.formField}>
        <label htmlFor="tax-other-capital-gains" className={styles.label}>
          Other Capital Gains (Debt Funds, Real Estate)
        </label>
        <input
          id="tax-other-capital-gains"
          type="text"
          value={otherCapitalGains}
          onChange={(e) => setOtherCapitalGains(e.target.value)}
          className={styles.input}
        />
      </div>
    </div>
  );
};
