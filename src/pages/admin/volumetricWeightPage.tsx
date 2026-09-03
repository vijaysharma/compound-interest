import React from 'react';
import VolumetricWeight from '../../components/admin/VolumetricWeight';
import SEOHead from '../../components/SEOHead';
const VolumetricWeightPage: React.FC = () => {
  return (
    <main className="w-full max-w-4xl mx-auto px-4 py-8">
      <SEOHead
        title="Volumetric Weight | Admin"
        description="Volumetric Weight for Admin"
        noIndex={true}
      />
      <h1 className="text-3xl font-bold mb-6 text-base-content text-center">Volumetric Weight</h1>
      <VolumetricWeight />
    </main>
  );
};
export default VolumetricWeightPage;
