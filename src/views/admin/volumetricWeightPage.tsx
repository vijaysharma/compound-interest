'use client';
import React from 'react';
import VolumetricWeight from '../../components/admin/VolumetricWeight';
import SEOHead from '../../components/SEOHead';
import styles from './AdminPage.module.scss';
const VolumetricWeightPage: React.FC = () => {
  return (
    <main className={styles.container}>
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
