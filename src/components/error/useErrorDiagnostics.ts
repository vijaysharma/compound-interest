'use client';
import { useState, useCallback } from 'react';
import { DiagnosticResult } from './errorData';
export function useErrorDiagnostics(error: Error & { digest?: string }, reset: () => void) {
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticResult>({
    tested: false,
    online: true,
    storage: true,
    latencyMs: null,
  });
  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
    }, 400);
  }, [reset]);
  const runDiagnostics = useCallback(() => {
    const startTime = performance.now();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    let storageOk = false;
    try {
      const testKey = '__diag_test__';
      window.localStorage.setItem(testKey, '1');
      storageOk = window.localStorage.getItem(testKey) === '1';
      window.localStorage.removeItem(testKey);
    } catch {
      storageOk = false;
    }
    const elapsed = Math.round(performance.now() - startTime);
    setDiagnosticState({
      tested: true,
      online: isOnline,
      storage: storageOk,
      latencyMs: elapsed,
    });
  }, []);
  const handleCopyReport = useCallback(() => {
    const report = `Error: ${error.message || 'Unknown error'}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}\nURL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard?.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [error]);
  return {
    copied,
    isRetrying,
    diagnosticState,
    handleRetry,
    runDiagnostics,
    handleCopyReport,
  };
}
