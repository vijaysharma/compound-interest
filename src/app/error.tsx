'use client';
import { useEffect, useState } from 'react';
import { ErrorBanner } from '@/components/error/ErrorBanner';
import { ErrorSubsystems } from '@/components/error/ErrorSubsystems';
import { ErrorTabsNav, ErrorTabKey } from '@/components/error/ErrorTabsNav';
import { ErrorRecoveryTab } from '@/components/error/ErrorRecoveryTab';
import { ErrorDiagnosticsTab } from '@/components/error/ErrorDiagnosticsTab';
import { ErrorDetailsTab } from '@/components/error/ErrorDetailsTab';
import { useErrorDiagnostics } from '@/components/error/useErrorDiagnostics';
import styles from '@/components/error/ErrorPage.module.scss';
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function ErrorPage({ error, reset }: ErrorProps) {
  const [activeTab, setActiveTab] = useState<ErrorTabKey>('recovery');
  const {
    copied,
    isRetrying,
    diagnosticState,
    handleRetry,
    runDiagnostics,
    handleCopyReport,
  } = useErrorDiagnostics(error, reset);
  useEffect(() => {
    console.error('Unhandled runtime error captured in error boundary:', error);
  }, [error]);
  const handleTabChange = (tab: ErrorTabKey) => {
    setActiveTab(tab);
    if (tab === 'diagnostics' && !diagnosticState.tested) {
      runDiagnostics();
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ErrorBanner onRetry={handleRetry} />
        <ErrorSubsystems />
        <ErrorTabsNav activeTab={activeTab} onTabChange={handleTabChange} />
        <div className={styles.contentArea}>
          {activeTab === 'recovery' && (
            <ErrorRecoveryTab isRetrying={isRetrying} onRetry={handleRetry} />
          )}
          {activeTab === 'diagnostics' && (
            <ErrorDiagnosticsTab
              diagnosticState={diagnosticState}
              onRerun={runDiagnostics}
            />
          )}
          {activeTab === 'details' && (
            <ErrorDetailsTab
              error={error}
              copied={copied}
              onCopy={handleCopyReport}
            />
          )}
        </div>
      </div>
    </div>
  );
}
