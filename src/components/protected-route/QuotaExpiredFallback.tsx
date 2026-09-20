import React from 'react';
import { Link } from '@/navigation';
import { FiClock, FiZap } from 'react-icons/fi';
import type { AuthUser } from '../../types/auth';
import styles from '../ProtectedRoute.module.scss';
interface QuotaExpiredFallbackProps {
  isQuotaExceeded: boolean;
  limit: number;
  user: AuthUser | null;
}
export function QuotaExpiredFallback({
  isQuotaExceeded,
  limit,
  user,
}: QuotaExpiredFallbackProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.cardWarning}`}>
        <div className={`${styles.iconWrapper} ${styles.iconWrapperWarning}`}>
          {isQuotaExceeded ? <FiZap className={styles.icon} /> : <FiClock className={styles.icon} />}
        </div>
        <h2 className={styles.title}>
          {isQuotaExceeded ? 'Calculation Limit Reached' : '48-Hour Free Trial Expired'}
        </h2>
        <p className={styles.subtitle}>
          {isQuotaExceeded
            ? `You have used all ${limit} free live Mutual Fund, Inflation & PPP calculation runs for `
            : 'Your 48-hour free trial period for live financial analytics has ended for '}
          <span className={styles.userHighlight}>{user?.email}</span>.
        </p>
        <p className={styles.description}>
          Unlock unlimited live calculations across all financial tools for just ₹54/month. Core
          calculators (FD, RD, EMI, SIP, SWP, Utilities) remain free.
        </p>
        <div className={styles.actionStack}>
          <Link to="/upgrade" className={styles.primaryBtn}>
            <FiZap className={styles.iconSm} />
            <span>Unlock Pro for ₹54 / Month &rarr;</span>
          </Link>
          <Link to="/fd-calculator" className={styles.ghostBtn}>
            Continue with Free Calculators Suite &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
