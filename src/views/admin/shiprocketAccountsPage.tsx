'use client';
import React from 'react';
import { ShiprocketAccountsManagerView } from './ShiprocketAccountsManagerView';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';
import styles from './AdminPage.module.scss';
const ShiprocketAccountsPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className={styles.shiprocketContainer}>
      <SEOHead
        title="Shiprocket Accounts Management | Admin"
        description="Configure and switch between multiple Shiprocket API accounts and company profiles"
        noIndex={true}
      />
      <ShiprocketAccountsManagerView token={token || ''} />
    </main>
  );
};
export default ShiprocketAccountsPage;
