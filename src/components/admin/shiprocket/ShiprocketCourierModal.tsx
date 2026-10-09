'use client';
import React, { useMemo, useState } from 'react';
import { FiSend, FiX, FiChevronRight, FiStar, FiCheckCircle, FiPrinter, FiCalendar } from 'react-icons/fi';
import type { ShiprocketOrder, ShiprocketCourierRate } from './types';
import type { AssignedShipment } from './useShiprocketModals';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketCourierModalProps {
  order: ShiprocketOrder;
  couriersList: ShiprocketCourierRate[];
  loadingCouriers: boolean;
  assigningCourier: boolean;
  assignedShipment: AssignedShipment | null;
  schedulingPickup: boolean;
  scheduledPickupDate: string | null;
  printingLabel: boolean;
  onAssignCourier: (shipmentId: number, courierId?: number) => void;
  onSchedulePickup: (shipmentId: number, pickupDate: string) => void;
  onPrintLabel: (shipmentId: number) => void;
  onClose: () => void;
}
const MAX_PICKUP_DAYS_AHEAD = 7;
/** Local calendar date as YYYY-MM-DD, `daysAhead` days from today. */
const localIsoDate = (daysAhead = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/**
 * Ship an order in two steps: choose the courier partner (or let Shiprocket pick), then — in the
 * same dialog — schedule the pickup and print the label for the AWB just generated.
 */
export const ShiprocketCourierModal: React.FC<ShiprocketCourierModalProps> = React.memo(
  ({
    order,
    couriersList,
    loadingCouriers,
    assigningCourier,
    assignedShipment,
    schedulingPickup,
    scheduledPickupDate,
    printingLabel,
    onAssignCourier,
    onSchedulePickup,
    onPrintLabel,
    onClose,
  }) => {
    const primaryShipmentId = order.shipments?.[0]?.id;
    const [pickupDate, setPickupDate] = useState(() => localIsoDate(0));
    const sortedCouriers = useMemo(
      () => [...couriersList].sort((a, b) => Number(a.rate) - Number(b.rate)),
      [couriersList]
    );
    const topRatedId = useMemo(() => {
      let best: ShiprocketCourierRate | null = null;
      for (const c of couriersList) {
        if (!best || Number(c.rating || 0) > Number(best.rating || 0)) best = c;
      }
      return best?.courier_company_id;
    }, [couriersList]);
    const cheapestId = sortedCouriers[0]?.courier_company_id;
    return (
      <div className={styles.modalBackdrop} onClick={onClose}>
        <div
          className={styles.modalBox}
          role="dialog"
          aria-modal="true"
          aria-label={`Ship order ${order.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div data-dialog-header className={styles.modalHeader}>
            <h3 data-dialog-title className={styles.modalTitle}>
              <FiSend /> {assignedShipment ? 'Schedule Pickup' : 'Choose Courier'} · Order #{order.id}
            </h3>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <FiX />
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.shipModalSummary}>
              <div>
                <strong>Customer:</strong> {order.customer_name} ({order.customer_city}, {order.customer_pincode})
              </div>
              <div>
                <strong>Weight:</strong> {order.shipments?.[0]?.weight || order.others?.weight || '0.5'} kg •{' '}
                {order.payment_method || 'Prepaid'}
              </div>
            </div>
            {assignedShipment ? (
              <div className={styles.shipStep}>
                <div className={styles.shipAssigned}>
                  <FiCheckCircle aria-hidden="true" />
                  <div>
                    <strong>{assignedShipment.courierName || 'Courier'} assigned</strong>
                    {assignedShipment.awb && <div>AWB: {assignedShipment.awb}</div>}
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="pickup-date">
                    <FiCalendar aria-hidden="true" /> Pickup date
                  </label>
                  <input
                    id="pickup-date"
                    type="date"
                    className={styles.fieldInput}
                    value={pickupDate}
                    min={localIsoDate(0)}
                    max={localIsoDate(MAX_PICKUP_DAYS_AHEAD)}
                    onChange={(e) => setPickupDate(e.target.value)}
                    disabled={Boolean(scheduledPickupDate)}
                  />
                </div>
                {scheduledPickupDate ? (
                  <p className={styles.shipPickupDone}>Pickup scheduled for {scheduledPickupDate}.</p>
                ) : null}
                <div data-dialog-footer className={styles.shipStepActions}>
                  {!scheduledPickupDate && (
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => onSchedulePickup(assignedShipment.shipmentId, pickupDate)}
                      disabled={schedulingPickup || !pickupDate}
                    >
                      {schedulingPickup ? 'Scheduling…' : 'Schedule Pickup'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.outlineBtn}
                    onClick={() => onPrintLabel(assignedShipment.shipmentId)}
                    disabled={printingLabel}
                  >
                    <FiPrinter /> {printingLabel ? 'Preparing…' : 'Print Label'}
                  </button>
                  <button type="button" className={styles.outlineBtn} onClick={onClose}>
                    {scheduledPickupDate ? 'Done' : 'Schedule Later'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.couriersHeaderRow}>
                  <h4 className={styles.couriersTitle}>Choose a courier partner</h4>
                </div>
                {loadingCouriers ? (
                  <div className={styles.emptyState}>
                    <span className={styles.spinner} />
                    <p className={styles.emptyDesc}>Calculating live rates & serviceability...</p>
                  </div>
                ) : sortedCouriers.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyDesc}>
                      No couriers returned for this route. Check the delivery pincode, or let Shiprocket assign one.
                    </p>
                  </div>
                ) : (
                  <div className={styles.couriersStack}>
                    {sortedCouriers.map((c) => (
                      <div key={c.courier_company_id} className={styles.courierCard}>
                        <div className={styles.courierInfo}>
                          <span className={styles.courierName}>
                            {c.courier_name}
                            {c.courier_company_id === cheapestId && (
                              <span className={styles.courierTag}>Cheapest</span>
                            )}
                            {c.courier_company_id === topRatedId && (
                              <span className={styles.courierTag}>Top rated</span>
                            )}
                          </span>
                          <span className={styles.courierEtd}>Estimated Delivery: {c.etd || '2-4 days'}</span>
                          <span className={styles.courierRating}>
                            <FiStar aria-hidden="true" /> {c.rating || '4.0'}
                          </span>
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
                            {assigningCourier ? 'Assigning…' : 'Ship with this'} <FiChevronRight />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => {
                    if (primaryShipmentId) onAssignCourier(primaryShipmentId);
                  }}
                  disabled={assigningCourier || !primaryShipmentId || loadingCouriers}
                >
                  Not sure? Let Shiprocket pick the best courier
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ShiprocketCourierModal.displayName = 'ShiprocketCourierModal';
