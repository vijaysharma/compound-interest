import React from 'react';
import styles from '../MutualFundAnalytics.module.scss';
export const SwpHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.badge}>Retirement Engine &bull; AMFI Historical Backtest</div>
      <h1 className={styles.title}>Mutual Fund SWP Retirement Backtesting Engine</h1>
      <p className={styles.subtitle}>
        Backtest systematic monthly withdrawals, step-up pension payouts, and residual portfolio
        longevity using live AMFI NAV histories.
      </p>
    </header>
  );
};
