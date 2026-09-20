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
      <body className={styles.body}>
        <div className={styles.card}>
          <div className={styles.brandIcon}>
            <span className={styles.brandSymbol}>₹</span>
          </div>
          <h1 className={styles.title}>Application Error</h1>
          <p className={styles.text}>
            An unexpected error interrupted the page layout. Please click below to reload the application.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={reset} className={styles.reloadBtn}>
              Reload Page
            </button>
            <a href="/" className={styles.homeLink}>
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
