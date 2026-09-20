import React, { useEffect, useState } from 'react';
import Link from '../../components/PrefetchLink';
import { useAuth } from '../../context/useAuth';
import styles from '../Home.module.scss';
export const HomeHeroSection: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>
          Institutional Precision &bull; 100% Free &amp; Private &bull; Real-Time Data
        </div>
        <h1 className={styles.heroTitle}>
          Rupee Calculator —{' '}
          <span className={styles.heroGradient}>
            Free SIP, FD, EMI &amp; Mutual Fund Tools for India
          </span>
        </h1>
        <p className={styles.heroDesc}>
          High-performance financial intelligence engine. Simulate Compound Interest, backtest SIP
          &amp; SWP scenarios, compare historical Mutual Fund NAVs, and model global Purchasing
          Power Parity in real time.
        </p>
        <div className={styles.heroActions}>
          <Link to="/sip-calculator" className={styles.btnPrimary}>
            Open SIP Calculator &rarr;
          </Link>
          <Link to="/mutual-funds/lumpsum" className={styles.btnOutline}>
            Mutual Fund Engine
          </Link>
          <Link to="/fd-calculator" className={styles.btnGhost}>
            Deposit &amp; EMI Tools &rarr;
          </Link>
        </div>
        {mounted && isAuthenticated && user && (
          <p className={styles.userNotice}>
            Signed in as <strong>{user.email}</strong>
          </p>
        )}
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <div className={styles.metricNumber}>10+</div>
            <div className={styles.metricLabel}>Financial &amp; Utility Tools</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricNumber}>0ms</div>
            <div className={styles.metricLabel}>Client Calculation Lag</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricNumber}>AMFI &amp; IMF</div>
            <div className={styles.metricLabel}>Verified Live Data</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricNumber}>100%</div>
            <div className={styles.metricLabel}>Private &amp; Local</div>
          </div>
        </div>
      </div>
    </section>
  );
};
