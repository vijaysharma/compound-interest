'use server';
import * as client from './admin/shiprocketClient';
import * as users from './admin/users';
import * as ai from './admin/ai';
import * as rates from './admin/shiprocketRates';
import * as account from './admin/shiprocketAccount';
import * as orders from './admin/shiprocketOrders';
import * as fulfillment from './admin/shiprocketFulfillment';
import * as postcode from './admin/postcode';
import * as sync from './admin/sync';
import * as navSync from './admin/navSync';
import * as navHistorySync from './admin/navHistorySync';
export async function getShiprocketAuth(forceRefresh?: boolean) {
  return client.getShiprocketAuth(forceRefresh);
}
export async function shiprocketFetch(endpoint: string, options?: RequestInit) {
  return client.shiprocketFetch(endpoint, options);
}
export async function getAdminUsersAction(token?: string | null) {
  return users.getAdminUsersAction(token);
}
export async function updateAdminUserAction(
  body: Parameters<typeof users.updateAdminUserAction>[0],
  token?: string | null
) {
  return users.updateAdminUserAction(body, token);
}
export async function getAISettingsAction(token?: string | null) {
  return ai.getAISettingsAction(token);
}
export async function updateAISettingsAction(
  body: Parameters<typeof ai.updateAISettingsAction>[0],
  token?: string | null
) {
  return ai.updateAISettingsAction(body, token);
}
export async function calculateShiprocketRatesAction(
  body: Parameters<typeof rates.calculateShiprocketRatesAction>[0],
  token?: string | null
) {
  return rates.calculateShiprocketRatesAction(body, token);
}
export async function getShiprocketCouriersAction(
  params: Parameters<typeof rates.getShiprocketCouriersAction>[0],
  token?: string | null
) {
  return rates.getShiprocketCouriersAction(params, token);
}
export async function getShiprocketAccountAction(token?: string | null) {
  return account.getShiprocketAccountAction(token);
}
export async function getShiprocketStatementAction(
  options?: Parameters<typeof account.getShiprocketStatementAction>[0],
  token?: string | null
) {
  return account.getShiprocketStatementAction(options, token);
}
export async function getShiprocketOrdersAction(
  options?: Parameters<typeof orders.getShiprocketOrdersAction>[0],
  token?: string | null
) {
  return orders.getShiprocketOrdersAction(options, token);
}
export async function getShiprocketTrackingAction(awb: string, token?: string | null) {
  return orders.getShiprocketTrackingAction(awb, token);
}
export async function createShiprocketOrderAction(
  payload: Record<string, unknown>,
  token?: string | null
) {
  return orders.createShiprocketOrderAction(payload, token);
}
export async function cancelShiprocketOrderAction(
  payload: Parameters<typeof orders.cancelShiprocketOrderAction>[0],
  token?: string | null
) {
  return orders.cancelShiprocketOrderAction(payload, token);
}
export async function assignShiprocketCourierAction(
  payload: Parameters<typeof fulfillment.assignShiprocketCourierAction>[0],
  token?: string | null
) {
  return fulfillment.assignShiprocketCourierAction(payload, token);
}
export async function generateShiprocketPickupAction(
  shipmentIds: (number | string)[],
  token?: string | null,
  pickupDate?: string
) {
  return fulfillment.generateShiprocketPickupAction(shipmentIds, token, pickupDate);
}
export async function generateShiprocketLabelAction(
  shipmentIds: (number | string)[],
  token?: string | null
) {
  return fulfillment.generateShiprocketLabelAction(shipmentIds, token);
}
export async function generateShiprocketInvoiceAction(
  orderIds: (number | string)[],
  token?: string | null
) {
  return fulfillment.generateShiprocketInvoiceAction(orderIds, token);
}
export async function getPostcodeDetailsAction(postcodeVal: string) {
  return postcode.getPostcodeDetailsAction(postcodeVal);
}
export async function syncMutualFundsAction(token?: string | null) {
  return sync.syncMutualFundsAction(token);
}
export async function syncIMFAction(token: string | null | undefined, payload: unknown) {
  return sync.syncIMFAction(token, payload);
}
export async function syncPPPAction(token?: string | null, inputPayload?: unknown) {
  return sync.syncPPPAction(token, inputPayload);
}
export async function syncNavAction(token?: string | null, options?: { schemeCodes?: string[] }) {
  return navSync.syncNavAction(token, options);
}
export async function syncNavHistoryAction(
  token: string | null | undefined,
  options: Parameters<typeof navHistorySync.syncNavHistoryAction>[1]
) {
  return navHistorySync.syncNavHistoryAction(token, options);
}
export async function getNavHistorySyncStatusAction(token?: string | null) {
  return navHistorySync.getNavHistorySyncStatusAction(token);
}
export async function listShiprocketAccountsAction(token?: string | null) {
  const { listShiprocketAccountsAction: fn } = await import('./admin/shiprocketAccountManager');
  return fn(token);
}
export async function switchActiveShiprocketAccountAction(accountId: string, token?: string | null) {
  const { switchActiveShiprocketAccountAction: fn } = await import('./admin/shiprocketAccountManager');
  return fn(accountId, token);
}
export async function saveShiprocketAccountAction(
  input: Parameters<typeof import('./admin/shiprocketAccountManager').saveShiprocketAccountAction>[0],
  token?: string | null
) {
  const { saveShiprocketAccountAction: fn } = await import('./admin/shiprocketAccountManager');
  return fn(input, token);
}
export async function deleteShiprocketAccountAction(accountId: string, token?: string | null) {
  const { deleteShiprocketAccountAction: fn } = await import('./admin/shiprocketAccountManager');
  return fn(accountId, token);
}
export async function updateShiprocketAccountAction(
  input: Parameters<typeof import('./admin/shiprocketAccountManager').updateShiprocketAccountAction>[0],
  token?: string | null
) {
  const { updateShiprocketAccountAction: fn } = await import('./admin/shiprocketAccountManager');
  return fn(input, token);
}
export async function listShiprocketCustomersAction(
  options?: Parameters<typeof import('./admin/shiprocketCustomerManager').listShiprocketCustomersAction>[0],
  token?: string | null
) {
  const { listShiprocketCustomersAction: fn } = await import('./admin/shiprocketCustomerManager');
  return fn(options, token);
}
export async function saveShiprocketCustomerAction(
  customer: Parameters<typeof import('./admin/shiprocketCustomerManager').saveShiprocketCustomerAction>[0],
  token?: string | null
) {
  const { saveShiprocketCustomerAction: fn } = await import('./admin/shiprocketCustomerManager');
  return fn(customer, token);
}
export async function deleteShiprocketCustomerAction(customerId: string, token?: string | null) {
  const { deleteShiprocketCustomerAction: fn } = await import('./admin/shiprocketCustomerManager');
  return fn(customerId, token);
}
export async function syncHistoricalCustomersAction(
  period: Parameters<typeof import('./admin/shiprocketCustomerManager').syncHistoricalCustomersAction>[0],
  token?: string | null
) {
  const { syncHistoricalCustomersAction: fn } = await import('./admin/shiprocketCustomerManager');
  return fn(period, token);
}
export async function mergeShiprocketCustomersAction(
  params: Parameters<typeof import('./admin/shiprocketCustomerManager').mergeShiprocketCustomersAction>[0],
  token?: string | null
) {
  const { mergeShiprocketCustomersAction: fn } = await import('./admin/shiprocketCustomerManager');
  return fn(params, token);
}
export type { NavHistorySyncReport, NavHistoryCheckpoint } from './admin/navHistoryTypes';
