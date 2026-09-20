import React from 'react';
import styles from '../CalculatorPage.module.scss';
export const InflationHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.badge}>
        Macroeconomic Intelligence &bull; IMF &amp; World Bank Data
      </div>
      <h1 className={styles.title}>
        Historical Inflation &amp; Future Purchasing Power Calculator India
      </h1>
      <p className={styles.subtitle}>
        Analyze purchasing power depreciation, future living expenses, and historical inflation
        benchmarks since 1990.
      </p>
    </header>
  );
};
