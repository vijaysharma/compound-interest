'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import { shiprocketFetch } from './shiprocketClient';
export async function assignShiprocketCourierAction(
  payload: { shipment_id: number | string; courier_id?: number | string; status?: string },
  token?: string | null
): Promise<{ success: boolean; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!payload.shipment_id) {
    throw new Error('Shipment ID is required');
  }
  const body: { shipment_id: string | number; courier_id?: string | number; status?: string } = {
    shipment_id: payload.shipment_id,
  };
  if (payload.courier_id) {
    body.courier_id = payload.courier_id;
  }
  if (payload.status) {
    body.status = payload.status;
  }
  const res = await shiprocketFetch('courier/assign/awb', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return { success: true, data };
}
export async function generateShiprocketPickupAction(
  shipmentIds: (number | string)[],
  token?: string | null
): Promise<{ success: boolean; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!shipmentIds || shipmentIds.length === 0) {
    throw new Error('At least one shipment ID is required');
  }
  const res = await shiprocketFetch('courier/generate/pickup', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentIds.map(Number) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return { success: true, data };
}
export async function generateShiprocketLabelAction(
  shipmentIds: (number | string)[],
  token?: string | null
): Promise<{ success: boolean; label_url?: string; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!shipmentIds || shipmentIds.length === 0) {
    throw new Error('At least one shipment ID is required');
  }
  const res = await shiprocketFetch('courier/generate/label', {
    method: 'POST',
    body: JSON.stringify({ shipment_id: shipmentIds.map(Number) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return {
    success: true,
    label_url: (data as { label_url?: string }).label_url,
    data,
  };
}
export async function generateShiprocketInvoiceAction(
  orderIds: (number | string)[],
  token?: string | null
): Promise<{ success: boolean; invoice_url?: string; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!orderIds || orderIds.length === 0) {
    throw new Error('At least one order ID is required');
  }
  const res = await shiprocketFetch('orders/print/invoice', {
    method: 'POST',
    body: JSON.stringify({ ids: orderIds.map(Number) }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return {
    success: true,
    invoice_url: (data as { invoice_url?: string }).invoice_url,
    data,
  };
}
