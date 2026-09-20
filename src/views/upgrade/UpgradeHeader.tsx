import React from 'react';
import Logo from '../../components/Logo';
import styles from '../Upgrade.module.scss';
export const UpgradeHeader: React.FC = () => {
  return (
    <div className={styles.header}>
      <div className={styles.badgeGroup}>
        <Logo />
        <span className={styles.supportBadge}>Support the Creator</span>
      </div>
      <h1 className={styles.title}>Keep Calculators Suite Ad-Free &amp; Alive</h1>
      <p className={styles.subtitle}>
        An honest, fast, private financial suite built for everyday investors in India.
      </p>
    </div>
  );
};
