import React from 'react';
import WoodCalculator from '../../components/admin/WoodCalculator';
import SEOHead from '../../components/SEOHead';
import styles from './AdminPage.module.scss';
const WoodCalculatorPage: React.FC = () => {
  return (
    <main className={styles.container}>
      <SEOHead
        title="Wood Calculator | Admin"
        description="Wood Calculator for Admin"
        noIndex={true}
      />
      <WoodCalculator />
    </main>
  );
};
export default WoodCalculatorPage;
