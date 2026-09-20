'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { ShiprocketOrder, ShiprocketTrackingData } from '@/types/shiprocket';
import { shiprocketFetch } from './shiprocketClient';
export async function getShiprocketOrdersAction(
  options: { page?: number; per_page?: number; search?: string; sort?: string; filter_by?: string } = {},
  token?: string | null
): Promise<{
  success: boolean;
  orders: ShiprocketOrder[];
  meta?: { pagination?: { total: number; count: number; per_page: number; current_page: number; total_pages: number } };
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.per_page) params.set('per_page', String(options.per_page));
  if (options.search) params.set('search', options.search.trim());
  if (options.sort) params.set('sort', options.sort);
  if (options.filter_by) params.set('filter_by', options.filter_by);
  const endpoint = `orders${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await shiprocketFetch(endpoint);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to fetch orders: HTTP ${res.status}`);
  }
  return {
    success: true,
    orders: Array.isArray(data?.data) ? (data.data as ShiprocketOrder[]) : [],
    meta: data?.meta,
  };
}
export async function getShiprocketTrackingAction(
  awb: string,
  token?: string | null
): Promise<{ success: boolean; tracking: ShiprocketTrackingData | null }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const cleanAwb = awb.trim();
  if (!cleanAwb) {
    throw new Error('AWB code is required for tracking');
  }
  const res = await shiprocketFetch(`courier/track/awb/${encodeURIComponent(cleanAwb)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to fetch tracking: HTTP ${res.status}`);
  }
  return {
    success: true,
    tracking: (data?.tracking_data as ShiprocketTrackingData) || null,
  };
}
export async function createShiprocketOrderAction(
  payload: Record<string, unknown>,
  token?: string | null
): Promise<{ success: boolean; data: { order_id?: number; shipment_id?: number; status?: string; [key: string]: unknown } }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (!payload.pickup_location || !payload.billing_customer_name || !payload.billing_address || !payload.billing_city || !payload.billing_pincode || !payload.billing_phone) {
    throw new Error('Missing mandatory fields: pickup location, customer name, address, city, pincode, or phone.');
  }
  const orderId = payload.order_id || `ORD-${Date.now()}`;
  const orderDate = payload.order_date || new Date().toISOString().slice(0, 10);
  const fullPayload = {
    order_id: String(orderId),
    order_date: String(orderDate),
    pickup_location: String(payload.pickup_location),
    billing_customer_name: String(payload.billing_customer_name),
    billing_last_name: String(payload.billing_last_name || ''),
    billing_address: String(payload.billing_address),
    billing_address_2: String(payload.billing_address_2 || ''),
    billing_city: String(payload.billing_city),
    billing_pincode: String(payload.billing_pincode),
    billing_state: String(payload.billing_state || ''),
    billing_country: 'India',
    billing_email: String(payload.billing_email || ''),
    billing_phone: String(payload.billing_phone),
    shipping_is_billing: true,
    order_items: Array.isArray(payload.order_items) && payload.order_items.length > 0 ? payload.order_items : [
      {
        name: 'Item 1',
        sku: `SKU-${Date.now()}`,
        units: 1,
        selling_price: Number(payload.sub_total || 100),
      },
    ],
    payment_method: payload.payment_method === 'COD' ? 'COD' : 'Prepaid',
    sub_total: Number(payload.sub_total || 100),
    length: Number(payload.length || 10),
    breadth: Number(payload.breadth || 10),
    height: Number(payload.height || 10),
    weight: Number(payload.weight || 0.5),
  };
  const res = await shiprocketFetch('orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(fullPayload),
  });
  const data = await res.json();
  if (!res.ok || data.status_code === 400 || data.status_code === 422) {
    throw new Error(data?.message || JSON.stringify(data));
  }
  return { success: true, data };
}
export async function cancelShiprocketOrderAction(
  payload: { order_ids?: (number | string)[]; awbs?: string[] },
  token?: string | null
): Promise<{ success: boolean; message?: string; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  if (payload.awbs && payload.awbs.length > 0) {
    const res = await shiprocketFetch('orders/cancel/shipment/awbs', {
      method: 'POST',
      body: JSON.stringify({ awbs: payload.awbs }),
    });
    const data = await res.json();
    return { success: res.ok, message: (data as { message?: string })?.message || 'Cancellation request sent', data };
  }
  if (payload.order_ids && payload.order_ids.length > 0) {
    const res = await shiprocketFetch('orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: payload.order_ids.map(Number) }),
    });
    const data = await res.json();
    return { success: res.ok, message: (data as { message?: string })?.message || 'Cancellation request sent', data };
  }
  throw new Error('Order IDs or AWBs required for cancellation');
}
