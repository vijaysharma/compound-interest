'use client';
import React from 'react';
import {
  FiTruck,
  FiSend,
  FiClock,
  FiPrinter,
  FiFileText,
  FiX,
} from 'react-icons/fi';
import type { ShiprocketOrder, OrderItemActionHandlers } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketShipmentActionsProps {
  order: ShiprocketOrder;
  awb?: string;
  canShip: boolean;
  canSchedulePickup: boolean;
  isDelivered: boolean;
  primaryShipmentId?: number;
  actionBusy: string | null;
  actions: OrderItemActionHandlers;
}
export const ShiprocketShipmentActions: React.FC<ShiprocketShipmentActionsProps> = React.memo(
  ({
    order,
    awb,
    canShip,
    canSchedulePickup,
    isDelivered,
    primaryShipmentId,
    actionBusy,
    actions,
  }) => (
    <div className={styles.orderFooter}>
      {awb && (
        <button
          className={`${styles.actionBtn} ${styles.actionPrimary}`}
          onClick={() => actions.onOpenTracking(awb)}
        >
          <FiTruck /> Track
        </button>
      )}
      {canShip && (
        <button
          className={`${styles.actionBtn} ${styles.actionPrimary}`}
          onClick={() => actions.onOpenShipModal(order)}
        >
          <FiSend /> Ship / Assign Courier
        </button>
      )}
      {canSchedulePickup && primaryShipmentId && (
        <button
          className={styles.actionBtn}
          onClick={() => actions.onSchedulePickup(primaryShipmentId)}
          disabled={actionBusy === `pickup-${primaryShipmentId}`}
        >
          <FiClock /> Schedule Pickup
        </button>
      )}
      {primaryShipmentId && (
        <button
          className={styles.actionBtn}
          onClick={() => actions.onPrintLabel(primaryShipmentId)}
          disabled={actionBusy === `label-${primaryShipmentId}`}
          title="Generate Shipping Label PDF"
        >
          <FiPrinter /> Label
        </button>
      )}
      <button
        className={styles.actionBtn}
        onClick={() => actions.onPrintInvoice(order.id)}
        disabled={actionBusy === `invoice-${order.id}`}
        title="Generate Tax Invoice PDF"
      >
        <FiFileText /> Invoice
      </button>
      {!isDelivered && (
        <button
          className={`${styles.actionBtn} ${styles.actionDanger}`}
          onClick={() => actions.onCancelShipment(order)}
          disabled={actionBusy === `cancel-${order.id}`}
        >
          <FiX /> Cancel
        </button>
      )}
    </div>
  )
);
ShiprocketShipmentActions.displayName = 'ShiprocketShipmentActions';
