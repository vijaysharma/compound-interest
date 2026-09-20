import React from 'react';
import { PlanDetails } from './types';
import { ProPricingCard } from './ProPricingCard';
import { TaxPricingCard } from './TaxPricingCard';
import styles from '../Upgrade.module.scss';
interface PricingPlansGridProps {
  proPlan: PlanDetails;
  taxPlan: PlanDetails;
  userEmail?: string;
  isProcessing: boolean;
  activeProcessingPlan: string | null;
  onSelectPlan: (planId: string) => void;
}
export const PricingPlansGrid: React.FC<PricingPlansGridProps> = ({
  proPlan,
  taxPlan,
  userEmail,
  isProcessing,
  activeProcessingPlan,
  onSelectPlan,
}) => {
  return (
    <div className={styles.plansGrid}>
      <ProPricingCard
        proPlan={proPlan}
        userEmail={userEmail}
        isProcessing={isProcessing}
        activeProcessingPlan={activeProcessingPlan}
        onSelectPlan={onSelectPlan}
      />
      <TaxPricingCard
        taxPlan={taxPlan}
        isProcessing={isProcessing}
        activeProcessingPlan={activeProcessingPlan}
        onSelectPlan={onSelectPlan}
      />
    </div>
  );
};
