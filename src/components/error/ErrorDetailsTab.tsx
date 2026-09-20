import React from 'react';
import styles from './ErrorPage.module.scss';
interface ErrorDetailsTabProps {
  error: Error & { digest?: string };
  copied: boolean;
  onCopy: () => void;
}
export const ErrorDetailsTab: React.FC<ErrorDetailsTabProps> = ({ error, copied, onCopy }) => {
  return (
    <div>
      <div className={styles.reportBox}>
        <div>
          <strong>Error:</strong> {error.message || 'Unknown error'}
        </div>
        <div>
          <strong>Digest:</strong> {error.digest || 'N/A'}
        </div>
        <div>
          <strong>Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
        </div>
      </div>
      {error.stack && (
        <details className={styles.stackDetails}>
          <summary className={styles.stackSummary}>Inspect Call Stack Trace</summary>
          <pre className={styles.stackPre}>{error.stack}</pre>
        </details>
      )}
      <button type="button" onClick={onCopy} className={styles.copyBtn}>
        {copied ? '✓ Diagnostic Report Copied' : '📋 Copy Diagnostic Report'}
      </button>
    </div>
  );
};
