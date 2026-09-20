import { TAX_SLABS, type FdTaxAnalysis } from './types';
import styles from '../CalculatorPage.module.scss';
interface FdTaxCardProps {
  mode: string;
  selectedPayoutTitle: string;
  isSeniorCitizen: boolean;
  setIsSeniorCitizen: (val: boolean) => void;
  taxSlab: number;
  setTaxSlab: (val: number) => void;
  invType: string;
  taxAnalysis: FdTaxAnalysis;
  payoutAmount: number;
  totalInterestEarned: number;
}
export function FdTaxCard({
  mode, selectedPayoutTitle, isSeniorCitizen, setIsSeniorCitizen,
  taxSlab, setTaxSlab, invType, taxAnalysis, payoutAmount, totalInterestEarned,
}: FdTaxCardProps) {
  const isPeriodic = mode !== '100' && invType === 'inv';
  return (
    <div className={styles.taxCard}>
      <div className={styles.taxHeader}>
        <span className={styles.taxTitle}>
          {mode === '100' ? 'Taxation & Post-Tax Returns' : `Taxation (${selectedPayoutTitle} Payout)`}
        </span>
        <label className={styles.seniorCitizenToggle}>
          <input
            type="checkbox"
            checked={isSeniorCitizen}
            onChange={(e) => setIsSeniorCitizen(e.target.checked)}
          />
          Senior Citizen (Sec 80TTB)
        </label>
      </div>
      <div className={styles.taxSlabSelector}>
        {TAX_SLABS.map((slab) => (
          <button
            key={slab}
            type="button"
            className={`${styles.taxSlabBtn} ${taxSlab === slab ? styles.taxSlabBtnActive : ''}`}
            onClick={() => setTaxSlab(slab)}
          >
            {slab}% Slab
          </button>
        ))}
      </div>
      <div className={styles.taxStatsGrid}>
        {isPeriodic ? (
          <>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Post-Tax {selectedPayoutTitle}</span>
              <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
                ₹{taxAnalysis.postTaxPeriodicPayout.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Tax / {selectedPayoutTitle}</span>
              <span className={`${styles.statValue} ${styles.statValueWarning}`}>
                ₹{taxAnalysis.periodicTax.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Total Post-Tax Interest</span>
              <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
                +₹{taxAnalysis.postTaxInterest.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Total Tax Over Tenure</span>
              <span className={`${styles.statValue} ${styles.statValueWarning}`}>
                ₹{taxAnalysis.estimatedTax.toLocaleString('en-IN')}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Estimated Tax (4% Cess)</span>
              <span className={`${styles.statValue} ${styles.statValueWarning}`}>
                ₹{taxAnalysis.estimatedTax.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Post-Tax Interest</span>
              <span className={`${styles.statValue} ${styles.statValueSuccess}`}>
                ₹{taxAnalysis.postTaxInterest.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Post-Tax Maturity</span>
              <span className={`${styles.statValue} ${styles.statValuePrimary}`}>
                ₹{taxAnalysis.postTaxMaturity.toLocaleString('en-IN')}
              </span>
            </div>
            <div className={styles.taxStatBox}>
              <span className={styles.statLabel}>Effective Post-Tax CAGR</span>
              <span className={styles.statValue}>{taxAnalysis.postTaxCagr}% p.a.</span>
            </div>
          </>
        )}
      </div>
      <div className={styles.taxNotice}>
        {isPeriodic && (
          <div>
            Pre-tax {selectedPayoutTitle.toLowerCase()} payout: ₹{payoutAmount.toLocaleString('en-IN')} (Total interest: ₹{totalInterestEarned.toLocaleString('en-IN')} over {taxAnalysis.numPayouts} payouts).
          </div>
        )}
        {taxAnalysis.isTdsApplicable
          ? `Sec 194A TDS (~10%) is likely deducted by your bank since estimated annual interest (~₹${Math.round(taxAnalysis.annualInterest).toLocaleString('en-IN')}) exceeds ₹${taxAnalysis.tdsThreshold.toLocaleString('en-IN')}. Submit Form 15G/15H if total income is below basic exemption.`
          : `Estimated annual interest (~₹${Math.round(taxAnalysis.annualInterest).toLocaleString('en-IN')}) is below the ₹${taxAnalysis.tdsThreshold.toLocaleString('en-IN')} TDS threshold (Sec 194A). No TDS deducted by bank, but interest is taxable per slab.`}
        {isSeniorCitizen && taxAnalysis.maxSec80TTB > 0 && (
          <span> Section 80TTB deduction of ₹{taxAnalysis.maxSec80TTB.toLocaleString('en-IN')} applied.</span>
        )}
      </div>
    </div>
  );
}
