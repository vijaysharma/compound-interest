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
      {loadingOrders ? (
        <div className={styles.emptyState}>
          <span className={styles.spinner} />
          <p className={styles.emptyDesc}>Loading Shiprocket orders...</p>
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
