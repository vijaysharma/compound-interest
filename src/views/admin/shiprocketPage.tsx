'use client';
import React from 'react';
import ShiprocketDashboard from '../../components/admin/ShiprocketDashboard';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';
import styles from './AdminPage.module.scss';
const ShiprocketPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className={styles.shiprocketContainer}>
      <SEOHead
        title="Shiprocket Dashboard | Admin"
        description="Shiprocket Account, Shipments, History & Creation"
        noIndex={true}
      />
      <ShiprocketDashboard token={token || ''} />
    </main>
  );
};
export default ShiprocketPage;
