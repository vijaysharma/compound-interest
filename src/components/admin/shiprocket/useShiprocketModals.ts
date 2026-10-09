'use client';
import { useState, useCallback } from 'react';
import {
  getShiprocketTrackingAction,
  getShiprocketCouriersAction,
  assignShiprocketCourierAction,
  generateShiprocketPickupAction,
  generateShiprocketLabelAction,
} from '../../../actions/admin';
import type {
  ShiprocketOrder,
  ShiprocketAccountData,
  ShiprocketTrackingData,
  ShiprocketCourierRate,
  AlertMessage,
} from './types';
export interface AssignedShipment {
  shipmentId: number;
  awb: string;
  courierName: string;
}
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
  // Second step of the ship dialog: the courier is assigned; schedule the pickup, print the label.
  const [assignedShipment, setAssignedShipment] = useState<AssignedShipment | null>(null);
  const [schedulingPickup, setSchedulingPickup] = useState(false);
  const [scheduledPickupDate, setScheduledPickupDate] = useState<string | null>(null);
  const [printingLabel, setPrintingLabel] = useState(false);
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
    setAssignedShipment(null);
    setScheduledPickupDate(null);
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
        const assigned = (res.data as { response?: { data?: { awb_code?: string; courier_name?: string } } })
          ?.response?.data;
        // Stay in the dialog: next comes the pickup and the label.
        setAssignedShipment({
          shipmentId,
          awb: assigned?.awb_code || '',
          courierName: assigned?.courier_name || '',
        });
        setAlertMsg({ type: 'success', text: 'Courier assigned and AWB generated successfully!' });
        void onOrdersUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign courier';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setAssigningCourier(false);
    }
  }, [token, onOrdersUpdated, setAlertMsg]);
  const handleSchedulePickup = useCallback(async (shipmentId: number, pickupDate: string) => {
    setSchedulingPickup(true);
    try {
      const res = await generateShiprocketPickupAction([shipmentId], token, pickupDate);
      if (res.success) {
        const scheduled = (res.data as { response?: { pickup_scheduled_date?: string } })?.response
          ?.pickup_scheduled_date;
        setScheduledPickupDate(scheduled || pickupDate);
        setAlertMsg({ type: 'success', text: `Pickup scheduled for ${scheduled || pickupDate}` });
        void onOrdersUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule pickup';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setSchedulingPickup(false);
    }
  }, [token, onOrdersUpdated, setAlertMsg]);
  const handlePrintShipmentLabel = useCallback(async (shipmentId: number) => {
    setPrintingLabel(true);
    try {
      const res = await generateShiprocketLabelAction([shipmentId], token);
      if (res.success && res.label_url) {
        window.open(res.label_url, '_blank', 'noopener,noreferrer');
      } else {
        setAlertMsg({ type: 'error', text: 'Label URL not returned by Shiprocket' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate label';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setPrintingLabel(false);
    }
  }, [token, setAlertMsg]);
  const closeShipModal = useCallback(() => {
    setShipModalOrder(null);
    setAssignedShipment(null);
    setScheduledPickupDate(null);
  }, []);
  return {
    trackingModalAwb,
    trackingData,
    loadingTracking,
    shipModalOrder,
    couriersList,
    loadingCouriers,
    assigningCourier,
    assignedShipment,
    schedulingPickup,
    scheduledPickupDate,
    printingLabel,
    setTrackingModalAwb,
    setShipModalOrder,
    handleOpenTracking,
    handleOpenShipModal,
    handleAssignCourier,
    handleSchedulePickup,
    handlePrintShipmentLabel,
    closeShipModal,
  };
}
