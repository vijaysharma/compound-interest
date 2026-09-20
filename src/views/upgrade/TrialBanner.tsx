import React from 'react';
import { Link } from '@/navigation';
import { FiClock } from 'react-icons/fi';
import styles from '../Upgrade.module.scss';
interface TrialBannerProps {
  remainingCalculations: number;
  freeLimit?: number;
  remainingTimeStr: string | null;
}
export const TrialBanner: React.FC<TrialBannerProps> = ({
  remainingCalculations,
  freeLimit = 15,
  remainingTimeStr,
}) => {
  return (
    <div className={styles.trialBanner}>
      <div className={styles.trialBannerContent}>
        <div>
          <div className={styles.trialEyebrow}>
            <FiClock />
            <span>Live Analytics Trial Active</span>
          </div>
          <p className={styles.trialMainText}>
            You have{' '}
            <span className={styles.highlightText}>
              {remainingCalculations} of {freeLimit}
            </span>{' '}
            live Mutual Fund, Inflation &amp; PPP calculation runs left
            {remainingTimeStr ? ` (${remainingTimeStr} left in your 48h trial)` : ''}.
          </p>
          <p className={styles.trialSubText}>
            All other tools (FD, RD, SWP, SIP, EMI, Utilities) are 100% free for 48 hours from
            first usage, and remain free to use afterwards.
          </p>
        </div>
        <Link to="/mutual-funds/lumpsum" className={styles.trialReturnBtn}>
          Return to Calculators &rarr;
        </Link>
      </div>
    </div>
  );
};
