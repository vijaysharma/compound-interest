'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { ShiprocketCourierRate } from '@/types/shiprocket';
import { shiprocketFetch } from './shiprocketClient';
export async function calculateShiprocketRatesAction(
  body: {
    pickup_postcode?: string;
    delivery_postcode?: string;
    weight?: number | string;
    length?: number | string;
    breadth?: number | string;
    height?: number | string;
    cod?: boolean | number;
  },
  token?: string | null
): Promise<{ success: boolean; data: unknown }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { pickup_postcode, delivery_postcode, weight, length, breadth, height, cod } = body;
  if (!pickup_postcode || !delivery_postcode || !weight) {
    throw new Error('Missing required fields: pickup, delivery, weight.');
  }
  const cleanPickup = String(pickup_postcode).replace(/\D/g, '').slice(0, 6);
  const cleanDelivery = String(delivery_postcode).replace(/\D/g, '').slice(0, 6);
  const cleanWeight = Math.max(0.01, Math.min(1000, Number(weight) || 0.5));
  const cleanLength = length ? Math.max(0, Number(length) || 0) : '';
  const cleanBreadth = breadth ? Math.max(0, Number(breadth) || 0) : '';
  const cleanHeight = height ? Math.max(0, Number(height) || 0) : '';
  const cleanCod = cod ? 1 : 0;
  if (cleanPickup.length !== 6 || cleanDelivery.length !== 6) {
    throw new Error('Pickup and delivery pincodes must be valid 6-digit numbers.');
  }
  const params = new URLSearchParams({
    pickup_postcode: cleanPickup,
    delivery_postcode: cleanDelivery,
    weight: cleanWeight.toString(),
    cod: cleanCod.toString(),
  });
  if (cleanLength) params.set('length', cleanLength.toString());
  if (cleanBreadth) params.set('breadth', cleanBreadth.toString());
  if (cleanHeight) params.set('height', cleanHeight.toString());
  const serviceabilityRes = await shiprocketFetch(`courier/serviceability/?${params.toString()}`);
  const data = await serviceabilityRes.json();
  if (!serviceabilityRes.ok) {
    throw new Error('Shiprocket API error: ' + JSON.stringify(data));
  }
  return { success: true, data };
}
export async function getShiprocketCouriersAction(
  params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number | string;
    cod?: boolean | number;
    length?: number | string;
    breadth?: number | string;
    height?: number | string;
  },
  token?: string | null
): Promise<{ success: boolean; couriers: ShiprocketCourierRate[] }> {
  const rates = await calculateShiprocketRatesAction(params, token);
  const couriers = ((rates.data as { data?: { available_courier_companies?: ShiprocketCourierRate[] } })?.data?.available_courier_companies || []) as ShiprocketCourierRate[];
  return { success: true, couriers };
}
