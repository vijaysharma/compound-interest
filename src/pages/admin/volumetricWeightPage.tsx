import React from 'react';
import VolumetricWeight from '../../components/admin/VolumetricWeight';
import SEOHead from '../../components/SEOHead';
const VolumetricWeightPage: React.FC = () => {
  return (
    <main className="w-full max-w-4xl mx-auto px-2 py-2">
      <SEOHead
        title="Volumetric Weight | Admin"
        description="Volumetric Weight for Admin"
        noIndex={true}
      />
      <VolumetricWeight />
    </main>
  );
};
export default VolumetricWeightPage;
