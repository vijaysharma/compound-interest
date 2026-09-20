import React from 'react';
import { FiAward, FiCheckCircle } from 'react-icons/fi';
import styles from '../IncomeTaxCalculator.module.scss';
interface VerdictBannerProps {
  isNewWinner: boolean;
  taxSavings: number;
  currencySymbol: string;
}
export const VerdictBanner: React.FC<VerdictBannerProps> = ({
  isNewWinner,
  taxSavings,
  currencySymbol,
}) => {
  return (
    <section className={styles.winnerBanner}>
      <div className={styles.winnerInfo}>
        <FiCheckCircle className={styles.winnerIcon} />
        <div>
          <h2 className={styles.winnerHeading}>
            Recommended: {isNewWinner ? 'New Tax Regime' : 'Old Tax Regime'}
          </h2>
          <p className={styles.winnerSubtext}>
            {taxSavings > 0 ? (
              <>
                You save{' '}
                <strong>
                  {currencySymbol}
                  {taxSavings.toLocaleString('en-IN')}
                </strong>{' '}
                in taxes by opting for the{' '}
                <strong>{isNewWinner ? 'New Tax Regime' : 'Old Tax Regime'}</strong>.
              </>
            ) : (
              'Both regimes yield identical tax payable for your financial figures.'
            )}
          </p>
        </div>
      </div>
      <div className={styles.winnerBadge}>
        <FiAward />
        <span>
          Save {currencySymbol}
          {taxSavings.toLocaleString('en-IN')}
        </span>
      </div>
    </section>
  );
};
