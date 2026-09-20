import React from 'react';
import Link from '../../components/PrefetchLink';
import styles from '../Home.module.scss';
export const HomeCtaSection: React.FC = () => {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.ctaInner}>
        <h2 className={styles.ctaTitle}>Ready to Optimize Your Finances?</h2>
        <p className={styles.ctaDesc}>
          Model your wealth compounding, loan repayments, and investment strategies with zero lag.
        </p>
        <div className={styles.ctaActions}>
          <Link to="/sip-calculator" className={styles.btnCtaSecondary}>
            Start Calculating Now &rarr;
          </Link>
          <Link to="/fd-calculator" className={styles.btnCtaOutline}>
            Deposit &amp; EMI Tools &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
};
