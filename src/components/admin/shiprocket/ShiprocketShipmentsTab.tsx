'use client';
import React from 'react';
import { FiSearch, FiPackage, FiPlus } from 'react-icons/fi';
import type { ShiprocketOrder, StatusFilter, OrderItemActionHandlers } from './types';
import { ShiprocketShipmentCard } from './ShiprocketShipmentCard';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketShipmentsTabProps {
  orders: ShiprocketOrder[];
  filteredOrders: ShiprocketOrder[];
  statusFilter: StatusFilter;
  searchQuery: string;
  loadingOrders: boolean;
  actionBusy: string | null;
  orderDateFrom?: string;
  orderDateTo?: string;
  onSetOrderDateFrom?: (val: string) => void;
  onSetOrderDateTo?: (val: string) => void;
  onApplyDateFilter?: (from?: string, to?: string) => void;
  stats: {
    pending: number;
    inTransit: number;
    delivered: number;
  };
  actions: OrderItemActionHandlers;
  onSetStatusFilter: (filter: StatusFilter) => void;
  onSetSearchQuery: (query: string) => void;
  onCreateShipmentTab: () => void;
}
export const ShiprocketShipmentsTab: React.FC<ShiprocketShipmentsTabProps> = React.memo(
  ({
    orders,
    filteredOrders,
    statusFilter,
    searchQuery,
    loadingOrders,
    actionBusy,
    orderDateFrom = '',
    orderDateTo = '',
    onSetOrderDateFrom,
    onSetOrderDateTo,
    onApplyDateFilter,
    stats,
    actions,
    onSetStatusFilter,
    onSetSearchQuery,
    onCreateShipmentTab,
  }) => (
    <>
      <div className={styles.filterControls}>
        <div className={styles.statusPills}>
          <button
            className={`${styles.statusPill} ${statusFilter === 'all' ? styles.statusPillActive : ''}`}
            onClick={() => onSetStatusFilter('all')}
          >
            All ({orders.length})
          </button>
          <button
            className={`${styles.statusPill} ${statusFilter === 'new' ? styles.statusPillActive : ''}`}
            onClick={() => onSetStatusFilter('new')}
          >
            Ready to Ship ({stats.pending})
          </button>
          <button
            className={`${styles.statusPill} ${statusFilter === 'in_transit' ? styles.statusPillActive : ''}`}
            onClick={() => onSetStatusFilter('in_transit')}
          >
            In Transit ({stats.inTransit})
          </button>
          <button
            className={`${styles.statusPill} ${statusFilter === 'delivered' ? styles.statusPillActive : ''}`}
            onClick={() => onSetStatusFilter('delivered')}
          >
            Delivered ({stats.delivered})
          </button>
          <button
            className={`${styles.statusPill} ${statusFilter === 'cancelled' ? styles.statusPillActive : ''}`}
            onClick={() => onSetStatusFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
        <div className={styles.filterRight}>
          <div className={styles.dateFilterGroup}>
            <div className={styles.dateFilterItem}>
              <span className={styles.dateInputLabel}>From:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={orderDateFrom}
                onChange={(e) => {
                  const val = e.target.value;
                  onSetOrderDateFrom?.(val);
                  onApplyDateFilter?.(val, orderDateTo);
                }}
                title="Filter historical orders from date"
              />
            </div>
            <div className={styles.dateFilterItem}>
              <span className={styles.dateInputLabel}>To:</span>
              <input
                type="date"
                className={styles.dateInput}
                value={orderDateTo}
                onChange={(e) => {
                  const val = e.target.value;
                  onSetOrderDateTo?.(val);
                  onApplyDateFilter?.(orderDateFrom, val);
                }}
                title="Filter historical orders to date"
              />
            </div>
            {(orderDateFrom || orderDateTo) && (
              <button
                type="button"
                className={`${styles.outlineBtn} ${styles.dateClearBtn}`}
                onClick={() => {
                  onSetOrderDateFrom?.('');
                  onSetOrderDateTo?.('');
                  onApplyDateFilter?.('', '');
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search order, customer, AWB..."
              value={searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      {loadingOrders ? (
        <div className={styles.ordersSkeleton} role="status" aria-label="Loading Shiprocket orders">
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.orderSkeletonCard} aria-hidden="true">
              <span className={`${styles.skeletonBar} ${styles.skeletonBarShort}`} />
              <span className={styles.skeletonBar} />
              <span className={`${styles.skeletonBar} ${styles.skeletonBarMid}`} />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <FiPackage className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No shipments found</h3>
          <p className={styles.emptyDesc}>
            {searchQuery
              ? 'No shipments match your current search query or filter.'
              : 'You have no registered shipments yet. Click "New Shipment" to create and ship one.'}
          </p>
          <button className={styles.primaryBtn} onClick={onCreateShipmentTab}>
            <FiPlus /> Create Shipment
          </button>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {filteredOrders.map((order) => (
            <ShiprocketShipmentCard
              key={order.id}
              order={order}
              actionBusy={actionBusy}
              actions={actions}
            />
          ))}
        </div>
      )}
    </>
  )
);
ShiprocketShipmentsTab.displayName = 'ShiprocketShipmentsTab';
