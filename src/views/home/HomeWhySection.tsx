import React from 'react';
import { FiShield, FiZap, FiCheckCircle } from 'react-icons/fi';
import styles from '../Home.module.scss';
export const HomeWhySection: React.FC = () => {
  return (
    <section className={styles.whySection}>
      <div className={styles.pillarsInner}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Why Indian Investors Choose Rupee Calculator</h2>
          <p className={styles.sectionSubtitle}>
            The premier privacy-first financial simulation suite in India.
          </p>
        </div>
        <div className={styles.whyGrid}>
          <div className={styles.whyCard}>
            <div className={styles.whyTitleGroup}>
              <FiShield />
              <span>100% Client-Side Privacy</span>
            </div>
            <p className={styles.whyText}>
              Zero data tracking. Your salary, loan balances, and investment amounts never leave
              your browser.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyTitleGroup}>
              <FiZap />
              <span>Zero Calculation Lag (0ms)</span>
            </div>
            <p className={styles.whyText}>
              Instant interactive feedback with responsive sliders and real-time amortization
              generation.
            </p>
          </div>
          <div className={styles.whyCard}>
            <div className={styles.whyTitleGroup}>
              <FiCheckCircle />
              <span>Official Institutional Data</span>
            </div>
            <p className={styles.whyText}>
              Live mutual fund NAV feeds from AMFI, global PPP metrics from World Bank, and CPI
              inflation from IMF.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
