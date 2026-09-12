'use client';
import React, { Suspense } from 'react';
import styles from '@/App.module.scss';
import TopBar from '@/components/TopBar';
import WebSidebar from '@/components/WebSidebar';
import LoadingFallback from '@/components/LoadingFallback';
import PaywallModal from '@/components/PaywallModal';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { RouteTracker } from '@/components/RouteTracker';
import NavigationProgressBar from '@/components/NavigationProgressBar';
export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <NavigationProgressBar />
        <RouteTracker />
        <TopBar className={styles.appTopbarSticky} />
        <div className={styles.appBody}>
          <WebSidebar />
          <main className={styles.mainContent}>
            <div className={styles.contentContainer}>
              <Suspense fallback={<LoadingFallback />}>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
        <PaywallModal />
      </SidebarProvider>
    </AuthProvider>
  );
}
