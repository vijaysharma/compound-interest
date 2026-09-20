import React from 'react';
import { Link } from '@/navigation';
import { FiZap } from 'react-icons/fi';
import type { AuthUser } from '../../types/auth';
import styles from '../ProtectedRoute.module.scss';
interface PaidRequiredFallbackProps {
  user: AuthUser | null;
}
export function PaidRequiredFallback({ user }: PaidRequiredFallbackProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.cardPrimary}`}>
        <div className={styles.iconWrapper}>
          <FiZap className={styles.icon} />
        </div>
        <h2 className={styles.title}>Pro Feature Required</h2>
        <p className={styles.subtitle}>
          Quick Notes is available exclusively for active Pro members. Signed in as{' '}
          <span className={styles.userHighlight}>{user?.email}</span>.
        </p>
        <p className={styles.description}>
          Upgrade to Pro for just ₹54/month to get unlimited rich-text Quick Notes with auto-sync, folders, tags, search, password protection, and cloud backups.
        </p>
        <div className={styles.actionStack}>
          <Link to="/upgrade" className={styles.primaryBtn}>
            <FiZap className={styles.iconSm} />
            <span>Unlock Pro for ₹54 / Month &rarr;</span>
          </Link>
          <Link
            to="/"
            state={{ stayOnHome: true }}
            onClick={() => {
              try {
                sessionStorage.setItem('stay_on_home', 'true');
                localStorage.setItem('last_visited_route', '/');
              } catch {
                // ignore
              }
            }}
            className={styles.ghostBtn}
          >
            &larr; Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
