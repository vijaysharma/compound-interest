'use server';
import { ensureTables, getDb, isAuthorizedUser } from '@/lib/db';
import type { ShiprocketAccountData, ShiprocketStatementItem } from '@/types/shiprocket';
import { getShiprocketAuth, shiprocketFetch } from './shiprocketClient';
export async function getShiprocketAccountAction(token?: string | null): Promise<{
  success: boolean;
  account: ShiprocketAccountData;
}> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const { user } = await getShiprocketAuth();
  let balance: string | number = '0.00';
  try {
    const balRes = await shiprocketFetch('account/details/wallet-balance');
    if (balRes.ok) {
      const balData = await balRes.json();
      balance = balData?.data?.balance_amount ?? '0.00';
    }
  } catch (err) {
    console.warn('Failed to fetch wallet balance:', err);
  }
  let pickupLocations: ShiprocketAccountData['pickupLocations'] = [];
  try {
    const pickupRes = await shiprocketFetch('settings/company/pickup');
    if (pickupRes.ok) {
      const pickupData = await pickupRes.json();
      pickupLocations = pickupData?.data?.shipping_address || [];
    }
  } catch (err) {
    console.warn('Failed to fetch pickup locations:', err);
  }
  let channels: ShiprocketAccountData['channels'] = [];
  try {
    const chanRes = await shiprocketFetch('channels');
    if (chanRes.ok) {
      const chanData = await chanRes.json();
      channels = Array.isArray(chanData?.data) ? chanData.data : Array.isArray(chanData) ? chanData : [];
    }
  } catch (err) {
    console.warn('Failed to fetch channels:', err);
  }
  return {
    success: true,
    account: {
      user: (user as ShiprocketAccountData['user']) || null,
      balance,
      pickupLocations,
      channels,
    },
  };
}
export async function getShiprocketStatementAction(
  options: { page?: number; per_page?: number; from?: string; to?: string } = {},
  token?: string | null
): Promise<{ success: boolean; data: ShiprocketStatementItem[]; balance?: string | number }> {
  const sql = getDb();
  await ensureTables(sql);
  if (!(await isAuthorizedUser(token, sql))) {
    throw new Error('Unauthorized: Admin access required');
  }
  const params = new URLSearchParams();
  if (options.page) params.set('page', String(options.page));
  if (options.per_page) params.set('per_page', String(options.per_page));
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  const endpoint = `account/details/statement${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await shiprocketFetch(endpoint);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Failed to fetch statement: HTTP ${res.status}`);
  }
  return {
    success: true,
    data: Array.isArray(data?.data) ? (data.data as ShiprocketStatementItem[]) : [],
    balance: data?.balance_amount,
  };
}
