'use client';
import React, { Suspense } from 'react';
import styles from '@/App.module.scss';
import TopBar from '@/components/TopBar';
import LoadingFallback from '@/components/LoadingFallback';
import PaywallModal from '@/components/PaywallModal';
import { AuthProvider } from '@/context/AuthContext';
import { RouteTracker } from '@/components/RouteTracker';
export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <RouteTracker />
      <TopBar className={styles.appTopbarSticky} />
      <div className={styles.appContainer}>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </div>
      <PaywallModal />
    </AuthProvider>
  );
}
