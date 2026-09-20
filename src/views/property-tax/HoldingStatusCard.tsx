import React from 'react';
import { FiAward } from 'react-icons/fi';
import type { PropertyTaxComparison } from '../../data/propertyTaxData';
import styles from '../PropertyTax.module.scss';
export function HoldingStatusCard({ comparison }: { comparison: PropertyTaxComparison }) {
  return (
    <div className={styles.holdingStatusCard}>
      <div className={styles.holdingBadgeGroup}>
        <span className={`${styles.statusPill} ${comparison.isLongTerm ? styles.ltcg : styles.stcg}`}>
          {comparison.isLongTerm ? 'Long-Term Asset' : 'Short-Term Asset'} ({comparison.holdingMonths} months)
        </span>
        {comparison.isGrandfathered && (
          <span className={`${styles.statusPill} ${styles.grandfathered}`}>
            <FiAward size={12} /> Grandfathered (Acquired before 23-Jul-2024)
          </span>
        )}
      </div>
      <div className={styles.ciiStat}>
        CII: {comparison.purchaseFY} (<strong>{comparison.purchaseCII}</strong>) &rarr;{' '}
        {comparison.saleFY} (<strong>{comparison.saleCII}</strong>)
      </div>
    </div>
  );
}
