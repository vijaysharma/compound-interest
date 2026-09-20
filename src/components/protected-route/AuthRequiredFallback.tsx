import React from 'react';
import { Link } from '@/navigation';
import { FiLock } from 'react-icons/fi';
import GoogleSignInButton from '../GoogleSignInButton';
import styles from '../ProtectedRoute.module.scss';
export function AuthRequiredFallback() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <FiLock className={styles.icon} />
        </div>
        <h2 className={styles.title}>Authentication Required</h2>
        <p className={styles.description}>
          Please sign in with your Google account to access all features.
        </p>
        <GoogleSignInButton className={styles.signInWrapper} />
        <div className={styles.backRow}>
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
            className={styles.backLink}
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
