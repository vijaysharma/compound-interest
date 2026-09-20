'use client';
import React from 'react';
import { FiCopy } from 'react-icons/fi';
import type { ShiprocketOrder, OrderItemActionHandlers } from './types';
import { ShiprocketShipmentActions } from './ShiprocketShipmentActions';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketShipmentCardProps {
  order: ShiprocketOrder;
  actionBusy: string | null;
  actions: OrderItemActionHandlers;
}
const getStatusClass = (status: string) => {
  const s = status.toUpperCase();
  if (s.includes('DELIVERED')) return styles.statusGreen;
  if (s.includes('TRANSIT') || s.includes('OUT FOR') || s.includes('SHIPPED')) return styles.statusBlue;
  if (s.includes('CANCEL') || s.includes('RTO')) return styles.statusRed;
  return styles.statusYellow;
};
export const ShiprocketShipmentCard: React.FC<ShiprocketShipmentCardProps> = React.memo(
  ({ order, actionBusy, actions }) => {
    const primaryShipment = order.shipments?.[0];
    const awb = primaryShipment?.awb;
    const courier = primaryShipment?.courier || primaryShipment?.sr_courier_name;
    const canShip = !awb || (order.status || '').toUpperCase() === 'NEW';
    const canSchedulePickup = Boolean(awb && !primaryShipment?.pickup_scheduled_date);
    const isDelivered = (order.status || '').toUpperCase().includes('DELIVERED');
    return (
      <div className={styles.orderCard}>
        <div className={styles.orderHeader}>
          <div className={styles.orderMeta}>
            <span className={styles.orderIdBadge}>#{order.id}</span>
            {order.channel_order_id && (
              <span className={styles.channelBadge}>{order.channel_order_id}</span>
            )}
            <span className={styles.orderDate}>
              {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
            </span>
          </div>
          <span className={`${styles.statusBadge} ${getStatusClass(order.status || '')}`}>
            {order.status || 'PROCESSING'}
          </span>
        </div>
        <div className={styles.orderBody}>
          <div>
            <div className={styles.colTitle}>Customer & Destination</div>
            <div className={styles.customerName}>{order.customer_name}</div>
            <div className={styles.customerAddress}>
              {order.customer_address}
              {order.customer_city ? `, ${order.customer_city}` : ''}
              {order.customer_state ? `, ${order.customer_state}` : ''}
              {order.customer_pincode ? ` - ${order.customer_pincode}` : ''}
            </div>
            {order.customer_phone && (
              <div className={styles.customerAddress}>Phone: {order.customer_phone}</div>
            )}
          </div>
          <div>
            <div className={styles.colTitle}>Logistics & Courier</div>
            <div className={styles.shipmentDetails}>
              <div>
                <strong>Courier:</strong> {courier || 'Unassigned'}
              </div>
              {awb ? (
                <div className={styles.awbCode}>
                  <span>AWB: {awb}</span>
                  <button
                    className={styles.copyBtn}
                    onClick={() => actions.onCopyAwb(awb)}
                    title="Copy AWB"
                  >
                    <FiCopy />
                  </button>
                </div>
              ) : (
                <div className={styles.awbPending}>
                  AWB Pending
                </div>
              )}
              <div>
                <strong>Pickup:</strong> {order.pickup_location || 'Default'}
              </div>
              <div>
                <strong>Weight:</strong> {primaryShipment?.weight || order.others?.weight || '0.5'} kg
              </div>
            </div>
          </div>
          <div>
            <div className={styles.colTitle}>Order & Items</div>
            <div className={styles.orderItemsSummary}>
              {order.products && order.products.length > 0 ? (
                order.products.map((p, idx) => (
                  <div key={idx}>
                    • {p.name} (x{p.quantity || 1})
                  </div>
                ))
              ) : (
                <div>Standard Package</div>
              )}
            </div>
            <div className={styles.orderTotal}>
              ₹{order.total || '0'}
              <span className={styles.paymentBadge}>
                {order.payment_method || 'Prepaid'}
              </span>
            </div>
          </div>
        </div>
        <ShiprocketShipmentActions
          order={order}
          awb={awb}
          canShip={canShip}
          canSchedulePickup={canSchedulePickup}
          isDelivered={isDelivered}
          primaryShipmentId={primaryShipment?.id}
          actionBusy={actionBusy}
          actions={actions}
        />
      </div>
    );
  }
);
ShiprocketShipmentCard.displayName = 'ShiprocketShipmentCard';
