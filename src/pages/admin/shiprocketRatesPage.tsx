import React from 'react';
import ShiprocketRates from '../../components/admin/ShiprocketRates';
import { useAuth } from '../../context/useAuth';
import SEOHead from '../../components/SEOHead';
const ShiprocketRatesPage: React.FC = () => {
  const { token } = useAuth();
  return (
    <main className="w-full max-w-4xl mx-auto px-2 py-2">
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
