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
  const [items, setItems] = useState<Array<{ name: string; sku: string; units: string; selling_price: string }>>([
    { name: '', sku: '', units: '1', selling_price: '299' },
  ]);
  const [shippingCharges, setShippingCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [paymentMode, setPaymentMode] = useState<'Prepaid' | 'COD'>('Prepaid');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [createdOrderResult, setCreatedOrderResult] = useState<{ orderId: number; shipmentId: number } | null>(null);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, { name: '', sku: '', units: '1', selling_price: '0' }]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }, []);

  const handleItemChange = useCallback(
    (index: number, field: 'name' | 'sku' | 'units' | 'selling_price', val: string) => {
      setItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, [field]: val } : it))
      );
    },
    []
  );

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
    const validItems = items.filter((it) => it.name.trim() !== '');
    if (validItems.length === 0) {
      setAlertMsg({ type: 'error', text: 'Please provide at least one item with a valid name.' });
      return;
    }
    setCreatingOrder(true);
    setAlertMsg(null);
    try {
      const itemsSubtotal = validItems.reduce(
        (acc, it) => acc + (parseFloat(it.selling_price) || 0) * (parseInt(it.units, 10) || 1),
        0
      );
      const shipChargeNum = parseFloat(shippingCharges) || 0;
      const discountNum = parseFloat(discount) || 0;
      const orderSubtotal = Math.max(0, itemsSubtotal + shipChargeNum - discountNum);

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
        sub_total: orderSubtotal,
        shipping_charges: shipChargeNum,
        discount: discountNum,
        weight: Number(parseFloat(weight) || 0.5),
        length: Number(parseFloat(length) || 10),
        breadth: Number(parseFloat(breadth) || 10),
        height: Number(parseFloat(height) || 10),
        order_items: validItems.map((it, idx) => ({
          name: it.name.trim(),
          sku: it.sku.trim() || `SKU-${Date.now()}-${idx + 1}`,
          units: Number(parseInt(it.units, 10) || 1),
          selling_price: Number(parseFloat(it.selling_price) || 0),
        })),
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
    custCity, custState, custPincode, paymentMode, items, shippingCharges, discount,
    weight, length, breadth, height, setAlertMsg, onOrderCreated,
  ]);
  return {
    pickupLoc, setPickupLoc, custName, setCustName, custPhone, setCustPhone,
    custEmail, setCustEmail, custAddress, setCustAddress, custAddress2, setCustAddress2,
    custPincode, setCustPincode, custCity, setCustCity, custState, setCustState,
    pincodeLoading, weight, setWeight, length, setLength, breadth, setBreadth,
    height, setHeight, items, shippingCharges, setShippingCharges, discount, setDiscount,
    onAddItem: handleAddItem, onRemoveItem: handleRemoveItem, onItemChange: handleItemChange,
    paymentMode, setPaymentMode, creatingOrder,
    createdOrderResult, setCreatedOrderResult, volumetricWeight, appliedWeight, handleCreateOrder,
  };
}
