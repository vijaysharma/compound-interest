'use client';
import { useEffect } from 'react';
import styles from './GlobalError.module.scss';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Critical root error captured in global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className={styles.errorBody}>
        <div className={styles.errorCard}>
          <div className={styles.iconBadge}>
            <span className={styles.currencySymbol}>₹</span>
          </div>
          <h1 className={styles.errorTitle}>
            Application Error
          </h1>
          <p className={styles.errorDesc}>
            An unexpected error interrupted the page layout. Please click below to reload the application.
          </p>
          <div className={styles.btnRow}>
            <button
              type="button"
              onClick={reset}
              className={styles.reloadBtn}
            >
              Reload Page
            </button>
            <a
              href="/"
              className={styles.homeLink}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
