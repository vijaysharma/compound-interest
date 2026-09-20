import React from 'react';
import type { ConstituentProfile } from './types';
import type { MFMetaType } from '../../data/api_data';
import styles from '../MutualFundDetailModal.module.scss';
export interface FundModalPortfolioSectionProps {
  meta: MFMetaType | null;
  constituentProfile: ConstituentProfile;
}
export const FundModalPortfolioSection: React.FC<FundModalPortfolioSectionProps> = React.memo(
  ({ meta, constituentProfile }) => (
    <div className={styles.infoSection}>
      <h3 className={styles.infoSectionTitle}>Scheme Portfolio &amp; Structural Profile</h3>
      <div className={styles.infoDetailsGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoItemLabel}>Asset Management Company</span>
          <span className={styles.infoItemValue}>{meta?.fund_house || 'Registered Indian AMC'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoItemLabel}>Category Mandate</span>
          <span className={styles.infoItemValue}>{constituentProfile.categoryType}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoItemLabel}>Benchmark Index</span>
          <span className={styles.infoItemValue}>{constituentProfile.benchmark}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoItemLabel}>Scheme Structure</span>
          <span className={styles.infoItemValue}>{meta?.scheme_type || 'Open Ended Growth Scheme'}</span>
        </div>
      </div>
      <div className={styles.constituentsBox}>
        <div className={styles.constituentsTitle}>Typical Core Holdings &amp; Major Constituents:</div>
        <div className={styles.constituentsContent}>{constituentProfile.topHoldings}</div>
        <div className={styles.constituentsSubTitle}>Representative Sector Exposure:</div>
        <div>{constituentProfile.sectors}</div>
      </div>
    </div>
  )
);
FundModalPortfolioSection.displayName = 'FundModalPortfolioSection';
