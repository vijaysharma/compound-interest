'use client';
import React from 'react';
import { FiSend, FiX, FiChevronRight } from 'react-icons/fi';
import type { ShiprocketOrder, ShiprocketCourierRate } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketCourierModalProps {
  order: ShiprocketOrder;
  couriersList: ShiprocketCourierRate[];
  loadingCouriers: boolean;
  assigningCourier: boolean;
  onAssignCourier: (shipmentId: number, courierId?: number) => void;
  onClose: () => void;
}
export const ShiprocketCourierModal: React.FC<ShiprocketCourierModalProps> = React.memo(
  ({
    order,
    couriersList,
    loadingCouriers,
    assigningCourier,
    onAssignCourier,
    onClose,
  }) => {
    const primaryShipmentId = order.shipments?.[0]?.id;
    return (
      <div className={styles.modalBackdrop} onClick={onClose}>
        <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>
              <FiSend /> Ship Order #{order.id}
            </h3>
            <button className={styles.closeBtn} onClick={onClose}>
              <FiX />
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.shipModalSummary}>
              <div>
                <strong>Customer:</strong> {order.customer_name} ({order.customer_city}, {order.customer_pincode})
              </div>
              <div>
                <strong>Weight:</strong> {order.shipments?.[0]?.weight || order.others?.weight || '0.5'} kg • {order.payment_method || 'Prepaid'}
              </div>
            </div>
            <div className={styles.couriersHeaderRow}>
              <h4 className={styles.couriersTitle}>
                Available Courier Partners
              </h4>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => {
                  if (primaryShipmentId) onAssignCourier(primaryShipmentId);
                }}
                disabled={assigningCourier || !primaryShipmentId}
              >
                Auto-Assign Best Courier
              </button>
            </div>
            {loadingCouriers ? (
              <div className={styles.emptyState}>
                <span className={styles.spinner} />
                <p className={styles.emptyDesc}>Calculating live rates & serviceability...</p>
              </div>
            ) : couriersList.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyDesc}>
                  No couriers returned for this route. You can still auto-assign or check pincode.
                </p>
              </div>
            ) : (
              <div className={styles.couriersStack}>
                {couriersList.map((c) => (
                  <div key={c.courier_company_id} className={styles.courierCard}>
                    <div className={styles.courierInfo}>
                      <span className={styles.courierName}>{c.courier_name}</span>
                      <span className={styles.courierEtd}>Estimated Delivery: {c.etd || '2-4 days'}</span>
                      <span className={styles.courierRating}>★ {c.rating || '4.0'}</span>
                    </div>
                    <div className={styles.courierRight}>
                      <span className={styles.courierPrice}>₹{c.rate}</span>
                      <button
                        className={styles.primaryBtn}
                        onClick={() => {
                          if (primaryShipmentId) onAssignCourier(primaryShipmentId, c.courier_company_id);
                        }}
                        disabled={assigningCourier || !primaryShipmentId}
                      >
                        Ship with this <FiChevronRight />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ShiprocketCourierModal.displayName = 'ShiprocketCourierModal';
