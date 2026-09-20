import React from 'react';
import { Link } from '@/navigation';
import { FiAlertTriangle, FiLock } from 'react-icons/fi';
import GoogleSignInButton from '../GoogleSignInButton';
import type { AuthUser } from '../../types/auth';
import styles from '../ProtectedRoute.module.scss';
interface AdminFallbackProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
}
export function AdminFallback({ isAuthenticated, isAdmin, user }: AdminFallbackProps) {
  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <FiLock className={styles.icon} />
          </div>
          <h2 className={styles.title}>Admin Authentication Required</h2>
          <p className={styles.description}>
            Please sign in with your administrator Google account to access data administration.
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
  if (!isAdmin) {
    return (
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.cardError}`}>
          <div className={`${styles.iconWrapper} ${styles.iconWrapperError}`}>
            <FiAlertTriangle className={styles.icon} />
          </div>
          <h2 className={`${styles.title} ${styles.titleError}`}>Admin Access Required</h2>
          <p className={styles.subtitle}>
            You are signed in as <span className={styles.userHighlight}>{user?.email}</span> (role:{' '}
            {user?.role}).
          </p>
          <p className={styles.description}>
            This administration portal is restricted to accounts with administrator privileges.
          </p>
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
            className={styles.primaryBtn}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return null;
}
