'use client';
import React from 'react';
import { FiDollarSign, FiExternalLink, FiPackage, FiTruck, FiCheckCircle } from 'react-icons/fi';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketStatsProps {
  balance?: string | number;
  stats: {
    total: number;
    inTransit: number;
    delivered: number;
    cancelled: number;
  };
}
export const ShiprocketStats: React.FC<ShiprocketStatsProps> = React.memo(({ balance, stats }) => (
  <div className={styles.overviewGrid}>
    <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
      <div className={styles.statLabel}>
        <span>Shiprocket Balance</span>
        <FiDollarSign className={styles.statIcon} />
      </div>
      <div className={styles.statValue}>
        ₹{balance ?? '0.00'}
      </div>
      <div className={styles.statSubtext}>
        <a
          href="https://app.shiprocket.in/billing/recharge"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.rechargeLink}
        >
          Recharge on Shiprocket <FiExternalLink />
        </a>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        <span>Total Shipments</span>
        <FiPackage className={styles.statIcon} />
      </div>
      <div className={styles.statValue}>{stats.total}</div>
      <div className={styles.statSubtext}>
        <span>All time orders</span>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        <span>In Transit</span>
        <FiTruck className={styles.statIcon} />
      </div>
      <div className={styles.statValue}>{stats.inTransit}</div>
      <div className={styles.statSubtext}>
        <span>En route to destination</span>
      </div>
    </div>
    <div className={styles.statCard}>
      <div className={styles.statLabel}>
        <span>Delivered</span>
        <FiCheckCircle className={styles.statIcon} />
      </div>
      <div className={styles.statValue}>{stats.delivered}</div>
      <div className={styles.statSubtext}>
        <span>Successfully completed</span>
      </div>
    </div>
  </div>
));
ShiprocketStats.displayName = 'ShiprocketStats';
