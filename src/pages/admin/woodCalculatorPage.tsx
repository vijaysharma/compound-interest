import React from 'react';
import WoodCalculator from '../../components/admin/WoodCalculator';
import SEOHead from '../../components/SEOHead';
const WoodCalculatorPage: React.FC = () => {
  return (
    <main className="w-full max-w-4xl mx-auto px-2 py-2">
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
