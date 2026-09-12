'use client';
import React, { useEffect, useState } from 'react';
import QuickNotes from '../components/admin/QuickNotes';
import { useAuth } from '../context/useAuth';
import SEOHead from '../components/SEOHead';
import Link from '../components/PrefetchLink';
import styles from './admin/AdminPage.module.scss';
const QuickNotesPage: React.FC = () => {
  const { token, isAuthenticated, loading } = useAuth();
  // AuthContext seeds token/user from localStorage during render, so this is
  // false on the server and already true on the first client render. Gate on
  // mount to keep the hydrated tree identical to the server-rendered one.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const resolving = !mounted || loading;
  const signedIn = isAuthenticated && Boolean(token);
  return (
    <main className={styles.notesContainer}>
      <SEOHead title="Quick Notes | Utilities" description="Quick Notes for Utilities" noIndex={true} />
      <div className={styles.notesInner}>
        {resolving ? (
          <div className={styles.notesAuthGate}>
            <span className={styles.notesAuthSpinner} />
          </div>
        ) : signedIn ? (
          <QuickNotes token={token || ''} />
        ) : (
          <div className={styles.notesAuthGate}>
            <h2 className={styles.notesAuthTitle}>Sign in to open Quick Notes</h2>
            <p className={styles.notesAuthText}>
              Notes are stored against your account, so they follow you across devices.
              Signing in on one device does not carry over to another.
            </p>
            <Link to="/login" className={styles.notesAuthBtn}>
              Sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
};
export default QuickNotesPage;
