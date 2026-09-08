import React from 'react';
import ShiprocketRates from '../../components/admin/ShiprocketRates';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';
import styles from './AdminPage.module.scss';
const ShiprocketRatesPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className={styles.container}>
      <SEOHead
        title="Shiprocket Rates | Admin"
        description="Shiprocket Rates for Admin"
        noIndex={true}
      />
      <ShiprocketRates token={token || ''} />
    </main>
  );
};
export default ShiprocketRatesPage;
