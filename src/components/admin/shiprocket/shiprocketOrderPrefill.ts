import type { ShiprocketCustomer } from '@/types/shiprocket';

export interface OrderPrefillData {
  name: string;
  phone: string;
  email: string;
  address: string;
  address2: string;
  pincode: string;
  city: string;
  state: string;
  accountId?: string;
}

export const SHIPROCKET_ORDER_PREFILL_KEY = 'shiprocket_order_prefill';

/**
 * Prefills email with account contact email, removing all "." only from the local-part (before @).
 * If contact email is empty/null/whitespace or missing @ -> returns empty string ''.
 *
 * Example:
 *   "john.doe.sales@gmail.com" -> "johndoesales@gmail.com"
 *   "support@domain.co.in" -> "support@domain.co.in"
 *   null / "" -> ""
 */
export function formatAccountContactEmail(contactEmail?: string | null): string {
  if (!contactEmail || typeof contactEmail !== 'string') {
    return '';
  }
  const trimmed = contactEmail.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) {
    return '';
  }
  const localPart = trimmed.slice(0, atIndex).replace(/\./g, '');
  const domainPart = trimmed.slice(atIndex);
  return `${localPart}${domainPart}`;
}

/**
 * Builds standard prefill object from a clicked customer record and account contact email.
 */
export function buildOrderPrefillFromCustomer(
  customer: Partial<ShiprocketCustomer>,
  accountContactEmail?: string | null
): OrderPrefillData {
  const phoneDigits = (customer.customer_phone || '').replace(/\D/g, '');
  // Format for Indian 10-digit mobile field
  const phone = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : phoneDigits;

  return {
    name: customer.customer_name || '',
    phone,
    email: formatAccountContactEmail(accountContactEmail),
    address: customer.customer_address || '',
    address2: customer.customer_address_2 || '',
    pincode: customer.customer_pincode || '',
    city: customer.customer_city || '',
    state: customer.customer_state || '',
    accountId: customer.source_account_ids?.[0] || undefined,
  };
}

/**
 * Saves prefill data to sessionStorage for safe transit across page navigation.
 */
export function saveOrderPrefill(data: OrderPrefillData): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SHIPROCKET_ORDER_PREFILL_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save Shiprocket order prefill to sessionStorage:', err);
  }
}

/**
 * Loads prefill data from sessionStorage.
 */
export function loadOrderPrefill(): OrderPrefillData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SHIPROCKET_ORDER_PREFILL_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrderPrefillData;
  } catch (err) {
    console.warn('Failed to load Shiprocket order prefill from sessionStorage:', err);
    return null;
  }
}

/**
 * Clears prefill data from sessionStorage once consumed.
 */
export function clearOrderPrefill(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SHIPROCKET_ORDER_PREFILL_KEY);
  } catch {}
}
