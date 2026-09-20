'use client';
import { useState, useCallback } from 'react';
import {
  generateShiprocketPickupAction,
  generateShiprocketLabelAction,
  generateShiprocketInvoiceAction,
  cancelShiprocketOrderAction,
} from '../../../actions/admin';
import type { ShiprocketOrder, AlertMessage } from './types';
export function useShiprocketActions(
  token: string,
  onOrdersUpdated: () => Promise<void>,
  setAlertMsg: (msg: AlertMessage | null) => void
) {
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const handleCopyAwb = useCallback((awb: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(awb);
      setAlertMsg({ type: 'success', text: `AWB ${awb} copied to clipboard` });
      setTimeout(() => setAlertMsg(null), 3000);
    }
  }, [setAlertMsg]);
  const handleSchedulePickup = useCallback(async (shipmentId: number) => {
    setActionBusy(`pickup-${shipmentId}`);
    try {
      const res = await generateShiprocketPickupAction([shipmentId], token);
      if (res.success) {
        setAlertMsg({ type: 'success', text: 'Pickup scheduled successfully!' });
        await onOrdersUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to schedule pickup';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  }, [token, onOrdersUpdated, setAlertMsg]);
  const handlePrintLabel = useCallback(async (shipmentId: number) => {
    setActionBusy(`label-${shipmentId}`);
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
      setActionBusy(null);
    }
  }, [token, setAlertMsg]);
  const handlePrintInvoice = useCallback(async (orderId: number) => {
    setActionBusy(`invoice-${orderId}`);
    try {
      const res = await generateShiprocketInvoiceAction([orderId], token);
      if (res.success && res.invoice_url) {
        window.open(res.invoice_url, '_blank', 'noopener,noreferrer');
      } else {
        setAlertMsg({ type: 'error', text: 'Invoice URL not returned by Shiprocket' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invoice';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  }, [token, setAlertMsg]);
  const handleCancelShipment = useCallback(async (order: ShiprocketOrder) => {
    const awb = order.shipments?.[0]?.awb;
    if (!window.confirm(`Are you sure you want to cancel order #${order.id}${awb ? ` (AWB: ${awb})` : ''}?`)) {
      return;
    }
    setActionBusy(`cancel-${order.id}`);
    try {
      const res = awb
        ? await cancelShiprocketOrderAction({ awbs: [awb] }, token)
        : await cancelShiprocketOrderAction({ order_ids: [order.id] }, token);
      if (res.success) {
        setAlertMsg({ type: 'success', text: res.message || 'Order cancellation request submitted.' });
        await onOrdersUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel shipment';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setActionBusy(null);
    }
  }, [token, onOrdersUpdated, setAlertMsg]);
  return {
    actionBusy,
    handleCopyAwb,
    handleSchedulePickup,
    handlePrintLabel,
    handlePrintInvoice,
    handleCancelShipment,
  };
}
