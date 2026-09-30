'use client';
import React from 'react';
import { ShiprocketCustomersManagerView } from './ShiprocketCustomersManagerView';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';
import styles from './AdminPage.module.scss';
const ShiprocketCustomersPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className={styles.shiprocketContainer}>
      <SEOHead
        title="Shiprocket Customers Directory | Admin"
        description="Consolidated customer directory across all Shiprocket accounts"
        noIndex={true}
      />
      <ShiprocketCustomersManagerView token={token || ''} />
    </main>
  );
};
export default ShiprocketCustomersPage;
