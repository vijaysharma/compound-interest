'use client';
import React from 'react';
import ShiprocketDashboard from '../../components/admin/ShiprocketDashboard';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';
const ShiprocketPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main style={{ width: '100%', minHeight: '100vh', padding: '0 0.5rem' }}>
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
