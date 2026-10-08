'use client';
import React from 'react';
import { FiExternalLink, FiPackage, FiTruck, FiCheckCircle } from 'react-icons/fi';
import styles from '../ShiprocketDashboard.module.scss';
import { FaIndianRupeeSign } from 'react-icons/fa6';
export interface ShiprocketStatsProps {
  balance?: string | number;
  loading?: boolean;
  stats: {
    total: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  };
}
export const ShiprocketStats: React.FC<ShiprocketStatsProps> = React.memo(({ balance, loading, stats }) => (
  <div className={styles.overviewGrid}>
    <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
      <div className={styles.statLabel}>
        <FaIndianRupeeSign className={styles.statIcon} />
        <span>Balance</span>
      </div>
      {loading ? (
        <div className={`${styles.shimmer} ${styles.skeletonStatValue}`} />
      ) : (
        <div className={styles.statValue}>{balance ?? '0.00'}</div>
      )}
      <div className={styles.statSubtext}>
        <a
          href="https://app.shiprocket.in/billing/recharge"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.rechargeLink}
        >
          Recharge <FiExternalLink />
        </a>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        <FiPackage className={styles.statIcon} />
        <span>Total Shipments</span>
      </div>
      {loading ? (
        <div className={`${styles.shimmer} ${styles.skeletonStatValue}`} />
      ) : (
        <div className={styles.statValue}>{stats.total}</div>
      )}
      <div className={styles.statSubtext}>
        <span>All time orders</span>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        <FiTruck className={styles.statIcon} />
        <span>In Transit</span>
      </div>
      {loading ? (
        <div className={`${styles.shimmer} ${styles.skeletonStatValue}`} />
      ) : (
        <div className={styles.statValue}>{stats.inTransit}</div>
      )}
      <div className={styles.statSubtext}>
        <span>En route to destination</span>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        <FiCheckCircle className={styles.statIcon} />
        <span>Delivered</span>
      </div>
      {loading ? (
        <div className={`${styles.shimmer} ${styles.skeletonStatValue}`} />
      ) : (
        <div className={styles.statValue}>{stats.delivered}</div>
      )}
      <div className={styles.statSubtext}>
        <span>Successfully completed</span>
      </div>
    </div>
  </div>
));
ShiprocketStats.displayName = 'ShiprocketStats';
