import React from 'react';
import styles from '../CurrencyConverter.module.scss';
export const CurrencyConverterHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.badge}>Forex &bull; Live Mid-Market Rates</div>
      <h1 className={styles.title}>Live Currency Converter &amp; Exchange Rates</h1>
      <p className={styles.subtitle}>
        Convert 160+ global currencies in real time with zero bank markup.
      </p>
    </header>
  );
};
