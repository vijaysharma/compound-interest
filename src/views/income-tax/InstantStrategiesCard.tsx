import React from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { TaxOptimizationTip } from '../../utilities/incomeTaxCalculations';
import styles from '../IncomeTaxCalculator.module.scss';
interface InstantStrategiesCardProps {
  tips: TaxOptimizationTip[];
  currencySymbol: string;
}
export const InstantStrategiesCard: React.FC<InstantStrategiesCardProps> = ({
  tips,
  currencySymbol,
}) => {
  return (
    <section className={styles.card}>
      <div className={styles.strategiesHeader}>
        <FiTrendingUp className={styles.trendingIcon} />
        <h2>Instant Tax Optimization Strategies</h2>
      </div>
      <p className={styles.cardDesc}>
        Actionable steps to legally minimize your tax liability under Indian tax laws:
      </p>
      <div className={styles.tipsGrid}>
        {tips.map((tip, idx) => (
          <div key={idx} className={styles.tipCard}>
            <div>
              <div className={styles.tipHeader}>
                <span className={styles.tipCategory}>{tip.category}</span>
                {tip.potentialTaxSavings > 0 && (
                  <span className={styles.tipSavings}>
                    Save up to {currencySymbol}
                    {tip.potentialTaxSavings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              <h4 className={styles.tipTitle}>{tip.title}</h4>
              <p className={styles.tipDesc}>{tip.description}</p>
            </div>
            {tip.codeSection && <div className={styles.tipRef}>Ref: {tip.codeSection}</div>}
          </div>
        ))}
      </div>
    </section>
  );
};
