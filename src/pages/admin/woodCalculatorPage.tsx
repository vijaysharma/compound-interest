import React from 'react';
import WoodCalculator from '../../components/admin/WoodCalculator';
import SEOHead from '../../components/SEOHead';
const WoodCalculatorPage: React.FC = () => {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8">
      <SEOHead
        title="Wood Calculator | Admin"
        description="Wood Calculator for Admin"
        noIndex={true}
      />
      <h1 className="text-3xl font-bold mb-6 text-base-content text-center">Wood Calculator</h1>
      <WoodCalculator />
    </main>
  );
};
export default WoodCalculatorPage;
