'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getPostcodeDetailsAction, createShiprocketOrderAction } from '../../../actions/admin';
import type { ShiprocketAccountData, AlertMessage } from './types';
export function useShiprocketCreateOrder(
  token: string,
  account: ShiprocketAccountData | null,
  onOrderCreated: () => Promise<void>,
  setAlertMsg: (msg: AlertMessage | null) => void
) {
  const [pickupLoc, setPickupLoc] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custAddress2, setCustAddress2] = useState('');
  const [custPincode, setCustPincode] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custState, setCustState] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [weight, setWeight] = useState('0.5');
  const [length, setLength] = useState('10');
  const [breadth, setBreadth] = useState('10');
  const [height, setHeight] = useState('10');
  const [itemName, setItemName] = useState('');
  const [itemSku, setItemSku] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('299');
  const [paymentMode, setPaymentMode] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<{ orderId: number; shipmentId: number } | null>(null);
  useEffect(() => {
    if (account?.pickupLocations && account.pickupLocations.length > 0 && !pickupLoc) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPickupLoc(account.pickupLocations[0].pickup_location);
    }
  }, [account, pickupLoc]);
  useEffect(() => {
    if (!custPincode || custPincode.length !== 6) return;
    const clean = custPincode.replace(/\D/g, '');
    if (clean.length === 6) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPincodeLoading(true);
      getPostcodeDetailsAction(clean)
        .then((raw) => {
          if (raw && typeof raw === 'object') {
            const data = raw as { postcode_details?: { city?: string; state?: string } };
            if (data.postcode_details?.city) {
              setCustCity(data.postcode_details.city);
              if (data.postcode_details.state) setCustState(data.postcode_details.state);
            }
          }
        })
        .catch(() => {})
        .finally(() => setPincodeLoading(false));
    }
  }, [custPincode]);
  const volumetricWeight = useMemo(() => {
    const l = parseFloat(length) || 10;
    const b = parseFloat(breadth) || 10;
    const h = parseFloat(height) || 10;
    return ((l * b * h) / 5000).toFixed(2);
  }, [length, breadth, height]);
  const appliedWeight = useMemo(() => {
    const d = parseFloat(weight) || 0.5;
    const v = parseFloat(volumetricWeight) || 0.5;
    return Math.max(d, v).toFixed(2);
  }, [weight, volumetricWeight]);
  const handleCreateOrder = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupLoc || !custName || !custPhone || !custAddress || !custCity || !custPincode) {
      setAlertMsg({ type: 'error', text: 'Please fill in all mandatory customer and address details.' });
      return;
    }
    setCreatingOrder(true);
    setAlertMsg(null);
    try {
      const payload = {
        order_id: `ORD-${Date.now()}`,
        order_date: new Date().toISOString().slice(0, 10),
        pickup_location: pickupLoc,
        billing_customer_name: custName,
        billing_phone: custPhone,
        billing_email: custEmail || `${custPhone}@customer.rupeecalculator.in`,
        billing_address: custAddress,
        billing_address_2: custAddress2,
        billing_city: custCity,
        billing_state: custState,
        billing_pincode: custPincode,
        billing_country: 'India',
        payment_method: paymentMode,
        sub_total: Number(itemPrice) * Number(itemQty || 1),
        weight: Number(weight || 0.5),
        length: Number(length || 10),
        breadth: Number(breadth || 10),
        height: Number(height || 10),
        order_items: [
          {
            name: itemName || 'Standard Item',
            sku: itemSku || `SKU-${Date.now()}`,
            units: Number(itemQty || 1),
            selling_price: Number(itemPrice || 299),
          },
        ],
      };
      const res = await createShiprocketOrderAction(payload, token);
      if (res.success && res.data?.order_id && res.data?.shipment_id) {
        setCreatedOrderResult({ orderId: res.data.order_id, shipmentId: res.data.shipment_id });
        setAlertMsg({
          type: 'success',
          text: `Shipment order created! Order ID: ${res.data.order_id}, Shipment ID: ${res.data.shipment_id}`,
        });
        await onOrderCreated();
      } else {
        throw new Error('Order creation did not return order & shipment IDs');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create shipment order';
      setAlertMsg({ type: 'error', text: msg });
    } finally {
      setCreatingOrder(false);
    }
  }, [
    token, pickupLoc, custName, custPhone, custEmail, custAddress, custAddress2,
    custCity, custState, custPincode, paymentMode, itemPrice, itemQty, weight,
    length, breadth, height, itemName, itemSku, setAlertMsg, onOrderCreated,
  ]);
  return {
    pickupLoc, setPickupLoc, custName, setCustName, custPhone, setCustPhone,
    custEmail, setCustEmail, custAddress, setCustAddress, custAddress2, setCustAddress2,
    custPincode, setCustPincode, custCity, setCustCity, custState, setCustState,
    pincodeLoading, weight, setWeight, length, setLength, breadth, setBreadth,
    height, setHeight, itemName, setItemName, itemSku, setItemSku, itemQty, setItemQty,
    itemPrice, setItemPrice, paymentMode, setPaymentMode, creatingOrder,
    createdOrderResult, setCreatedOrderResult, volumetricWeight, appliedWeight, handleCreateOrder,
  };
}
