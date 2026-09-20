import React from 'react';
import { FiCoffee } from 'react-icons/fi';
import styles from '../Upgrade.module.scss';
export const DeveloperLetterCard: React.FC = () => {
  return (
    <div className={styles.letterCard}>
      <div className={styles.letterHeader}>
        <div className={styles.letterIconWrapper}>
          <FiCoffee size={20} />
        </div>
        <div>
          <h2 className={styles.letterHeading}>A quick note from the developer</h2>
          <p className={styles.letterSubhead}>Why independent tools make a huge difference</p>
        </div>
      </div>
      <div className={styles.letterBody}>
        <p>
          Hey there! I built this platform because I was tired of bloated financial websites stuffed
          with credit card ads, loan banners, and spammy popups asking for phone numbers.
        </p>
        <p>
          I wanted a tool that was fast, honest, and mathematically accurate. I wrote every calculator
          from scratch—hooking up daily syncs for thousands of AMFI mutual fund NAVs, decades of IMF
          inflation data, and realistic inflation-adjusted SWP and SIP formulas so you can plan your
          retirement without guesswork.
        </p>
        <p>
          I don&apos;t run spammy ads, and I never sell your data to financial telemarketers. But
          running PostgreSQL databases, serverless edge compute, and daily mutual fund data feeds
          costs money every month.
        </p>
        <p className={styles.highlightText}>
          Our base plan is less than ₹1.80 a day—literally less than a cutting chai. If this
          platform saved you time or gave you clarity on your financial goals, your support directly
          keeps this project alive, ad-free, and growing.
        </p>
      </div>
    </div>
  );
};
