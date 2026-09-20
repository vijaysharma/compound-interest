import React from 'react';
import { getChartSeriesColor } from '@/data/chartColors';
import type { DetailedFundItem } from './types';
import type { MFMetaType } from '../../data/api_data';
import styles from '../MutualFundDetailModal.module.scss';
export interface FundModalHeaderProps {
  fund: DetailedFundItem;
  meta: MFMetaType | null;
  onClose: () => void;
}
export const FundModalHeader: React.FC<FundModalHeaderProps> = React.memo(({ fund, meta, onClose }) => (
  <div className={styles.header}>
    <div className={styles.headerLeft}>
      <span
        className={styles.colorIndicator}
        ref={(el) => {
          if (el) el.style.backgroundColor = fund.color || getChartSeriesColor(0);
        }}
      />
      <div className={styles.titleGroup}>
        <h2 className={styles.title}>{fund.schemeName}</h2>
        <div className={styles.metaTags}>
          {meta?.fund_house && <span className={`${styles.tag} ${styles.tagPrimary}`}>{meta.fund_house}</span>}
          {meta?.scheme_category && <span className={styles.tag}>{meta.scheme_category}</span>}
          <span className={styles.tag}>Code: {fund.schemeCode}</span>
          {meta?.isin_growth && <span className={styles.tag}>ISIN: {meta.isin_growth}</span>}
        </div>
      </div>
    </div>
    <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
      &times;
    </button>
  </div>
));
FundModalHeader.displayName = 'FundModalHeader';
