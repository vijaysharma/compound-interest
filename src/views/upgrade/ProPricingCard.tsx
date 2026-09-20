import React from 'react';
import { FiCheck, FiLock } from 'react-icons/fi';
import { PlanDetails } from './types';
import styles from '../Upgrade.module.scss';
interface ProPricingCardProps {
  proPlan: PlanDetails;
  userEmail?: string;
  isProcessing: boolean;
  activeProcessingPlan: string | null;
  onSelectPlan: (planId: string) => void;
}
const PRO_FEATURES = [
  'Unlimited Live AMFI Mutual Fund Sync',
  'Full Historical IMF Inflation Modeling',
  'World Bank Global PPP Economics',
  'Quick Notes Financial Scratchpad',
  'Zero Advertisements & Complete Privacy',
];
export const ProPricingCard: React.FC<ProPricingCardProps> = ({
  proPlan,
  userEmail,
  isProcessing,
  activeProcessingPlan,
  onSelectPlan,
}) => {
  return (
    <div className={styles.pricingCard}>
      <div className={styles.pricingContent}>
        <div className={styles.pricingInfo}>
          <span className={styles.proBadge}>Pro Access</span>
          <div className={styles.priceDisplay}>
            <span className={styles.priceAmount}>₹{proPlan.price}</span>
            <span className={styles.pricePeriod}>{proPlan.period}</span>
          </div>
          {proPlan.savings && (
            <div className={styles.savingsBadgeText}>{proPlan.savings}</div>
          )}
          <p className={styles.pricingAccount}>
            Instant activation for <span>{userEmail || 'your account'}</span>
          </p>
        </div>
        <div className={styles.checkoutAction}>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => onSelectPlan(proPlan.id)}
            className={styles.payButton}
          >
            {isProcessing && activeProcessingPlan === proPlan.id ? (
              <>
                <span className={styles.spinner} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FiLock />
                <span>Pay ₹{proPlan.price} &amp; Unlock Pro</span>
              </>
            )}
          </button>
          <p className={styles.payMethodsNote}>UPI • Cards • NetBanking</p>
        </div>
      </div>
      <div className={`${styles.featuresGrid} ${styles.gridCol1}`}>
        {PRO_FEATURES.map((feature) => (
          <div key={feature} className={styles.featureItem}>
            <FiCheck className={styles.featureCheckIcon} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
