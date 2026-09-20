'use client';
import { useState, useCallback } from 'react';
import {
  getShiprocketTrackingAction,
  getShiprocketCouriersAction,
  assignShiprocketCourierAction,
} from '../../../actions/admin';
import type {
  ShiprocketOrder,
  ShiprocketAccountData,
  ShiprocketTrackingData,
  ShiprocketCourierRate,
  AlertMessage,
} from './types';
export function useShiprocketModals(
  token: string,
  account: ShiprocketAccountData | null,
  onOrdersUpdated: () => Promise<void>,
  setAlertMsg: (msg: AlertMessage | null) => void
) {
  const [trackingModalAwb, setTrackingModalAwb] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<ShiprocketTrackingData | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [shipModalOrder, setShipModalOrder] = useState<ShiprocketOrder | null>(null);
  const [couriersList, setCouriersList] = useState<ShiprocketCourierRate[]>([]);
  const [loadingCouriers, setLoadingCouriers] = useState(false);
  const [assigningCourier, setAssigningCourier] = useState(false);
  const handleOpenTracking = useCallback(async (awb: string) => {
    setTrackingModalAwb(awb);
    setTrackingData(null);
    setLoadingTracking(true);
    try {
      const res = await getShiprocketTrackingAction(awb, token);
      if (res.success && res.tracking) {
        setTrackingData(res.tracking);
      } else {
        setAlertMsg({ type: 'error', text: 'No live tracking data available yet for this AWB' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tracking lookup failed';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingTracking(false);
    }
  }, [token, setAlertMsg]);
  const handleOpenShipModal = useCallback(async (order: ShiprocketOrder) => {
    setShipModalOrder(order);
    setCouriersList([]);
    setLoadingCouriers(true);
    try {
      const pickupPincode =
        order.pickup_address_detail?.pin_code ||
        account?.pickupLocations.find((l) => l.pickup_location === order.pickup_location)?.pin_code ||
        account?.pickupLocations[0]?.pin_code ||
        '';
      const deliveryPincode = order.customer_pincode || '';
      const orderWeight = order.shipments?.[0]?.weight || order.others?.weight || '0.5';
      if (pickupPincode && deliveryPincode) {
        const res = await getShiprocketCouriersAction(
          {
            pickup_postcode: String(pickupPincode),
            delivery_postcode: String(deliveryPincode),
            weight: orderWeight,
            cod: order.payment_method?.toLowerCase() === 'cod' ? 1 : 0,
          },
          token
        );
        if (res.success && res.couriers) {
          setCouriersList(res.couriers);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch serviceable couriers';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setLoadingCouriers(false);
    }
  }, [token, account, setAlertMsg]);
  const handleAssignCourier = useCallback(async (shipmentId: number, courierId?: number) => {
    setAssigningCourier(true);
    try {
      const res = await assignShiprocketCourierAction(
        { shipment_id: shipmentId, courier_id: courierId },
        token
      );
      if (res.success) {
        setAlertMsg({ type: 'success', text: 'Courier assigned and AWB generated successfully!' });
        setShipModalOrder(null);
        await onOrdersUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign courier';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setAssigningCourier(false);
    }
  }, [token, onOrdersUpdated, setAlertMsg]);
  return {
    trackingModalAwb,
    trackingData,
    loadingTracking,
    shipModalOrder,
    couriersList,
    loadingCouriers,
    assigningCourier,
    setTrackingModalAwb,
    setShipModalOrder,
    handleOpenTracking,
    handleOpenShipModal,
    handleAssignCourier,
  };
}
