import React from 'react';
import { FiCheck, FiLock } from 'react-icons/fi';
import { PlanDetails } from './types';
import styles from '../Upgrade.module.scss';
interface TaxPricingCardProps {
  taxPlan: PlanDetails;
  isProcessing: boolean;
  activeProcessingPlan: string | null;
  onSelectPlan: (planId: string) => void;
}
const TAX_FEATURES = [
  'Personalized Tax Strategy & Optimization Engine',
  'Dual-Regime Breakeven & Crossover Roadmap',
  'Capital Gains Harvesting & Section 80C/80D Advice',
  'Year-Round Tax Strategy Consultations',
];
export const TaxPricingCard: React.FC<TaxPricingCardProps> = ({
  taxPlan,
  isProcessing,
  activeProcessingPlan,
  onSelectPlan,
}) => {
  return (
    <div className={`${styles.pricingCard} ${styles.pricingCardTax}`}>
      <div className={styles.pricingContent}>
        <div className={styles.pricingInfo}>
          <span className={`${styles.proBadge} ${styles.taxBadge}`}>
            Tax Pro &amp; Advisory
          </span>
          <div className={styles.priceDisplay}>
            <span className={`${styles.priceAmount} ${styles.priceTaxColor}`}>
              ₹{taxPlan.price}
            </span>
            <span className={styles.pricePeriod}>{taxPlan.period}</span>
          </div>
          {taxPlan.savings && (
            <div className={styles.savingsBadgeText}>{taxPlan.savings}</div>
          )}
          <p className={styles.pricingAccount}>For active taxpayers &amp; investors</p>
        </div>
        <div className={styles.checkoutAction}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onSelectPlan(taxPlan.id)}
            className={`${styles.payButton} ${styles.taxButton}`}
          >
            {isProcessing && activeProcessingPlan === taxPlan.id ? (
              <>
                <span className={styles.spinner} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiLock />
                <span>Pay ₹{taxPlan.price} &amp; Unlock Tax Pro</span>
              </>
            )}
          </button>
          <p className={styles.payMethodsNote}>UPI • Cards • NetBanking</p>
        </div>
      </div>
      <div className={`${styles.featuresGrid} ${styles.gridCol1}`}>
        <div className={styles.featureItem}>
          <FiCheck className={`${styles.featureCheckIcon} ${styles.taxFeatureCheckIcon}`} />
          <strong>Includes Everything in Pro Access</strong>
        </div>
        {TAX_FEATURES.map((feature) => (
          <div key={feature} className={styles.featureItem}>
            <FiCheck className={`${styles.featureCheckIcon} ${styles.taxFeatureCheckIcon}`} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
