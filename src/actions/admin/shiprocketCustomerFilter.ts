import type { DbShiprocketCustomer } from '@/lib/db/types';

export function matchCustomer(c: DbShiprocketCustomer, term: string): boolean {
  if (!term) return true;
  const lowerTerm = term.toLowerCase();

  if ((c.customer_name || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_email || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_address || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_address_2 || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_city || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_state || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_pincode || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_phone || '').toLowerCase().includes(lowerTerm)) return true;
  if ((c.customer_phone_2 || '').toLowerCase().includes(lowerTerm)) return true;

  // If query is formatted like a phone number (only digits, spaces, plus, dashes, parentheses)
  if (/^[+\d\s().-]+$/.test(term)) {
    const digitsTerm = term.replace(/\D/g, '');
    if (digitsTerm.length >= 3) {
      const p1Digits = (c.customer_phone || '').replace(/\D/g, '');
      const p2Digits = (c.customer_phone_2 || '').replace(/\D/g, '');
      const last10 = digitsTerm.length >= 10 ? digitsTerm.slice(-10) : digitsTerm;

      if (
        p1Digits.includes(digitsTerm) ||
        p2Digits.includes(digitsTerm) ||
        p1Digits.includes(last10) ||
        p2Digits.includes(last10)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function sortCustomers(
  customers: DbShiprocketCustomer[],
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): DbShiprocketCustomer[] {
  const sorted = [...customers];
  const validSort = ['name', 'phone', 'city', 'state', 'pincode', 'orders', 'updated_at', 'created_at'].includes(
    sortBy
  )
    ? sortBy
    : 'name';

  const sortFn = (a: DbShiprocketCustomer, b: DbShiprocketCustomer) => {
    let aVal: unknown = 0;
    let bVal: unknown = 0;

    if (validSort === 'name') {
      aVal = a.customer_name || '';
      bVal = b.customer_name || '';
    } else if (validSort === 'phone') {
      aVal = a.customer_phone || '';
      bVal = b.customer_phone || '';
    } else if (validSort === 'city') {
      aVal = a.customer_city || '';
      bVal = b.customer_city || '';
    } else if (validSort === 'state') {
      aVal = a.customer_state || '';
      bVal = b.customer_state || '';
    } else if (validSort === 'pincode') {
      aVal = a.customer_pincode || '';
      bVal = b.customer_pincode || '';
    } else if (validSort === 'orders') {
      aVal = a.total_orders || 0;
      bVal = b.total_orders || 0;
    } else if (validSort === 'updated_at') {
      aVal = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      bVal = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    } else if (validSort === 'created_at') {
      aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
      bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
    }

    const cmp =
      typeof aVal === 'string' && typeof bVal === 'string'
        ? aVal.localeCompare(bVal)
        : Number(aVal) - Number(bVal);

    return sortOrder === 'desc' ? -cmp : cmp;
  };

  sorted.sort(sortFn);
  return sorted;
}

export function filterAndPaginateCustomers(
  allRows: DbShiprocketCustomer[],
  options: {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    perPage?: number;
  } = {}
): { customers: DbShiprocketCustomer[]; total: number } {
  const {
    search = '',
    sortBy = 'name',
    sortOrder = 'asc',
    page = 1,
    perPage = 25,
  } = options;

  const term = (search || '').trim();
  const filtered = term ? allRows.filter((c) => matchCustomer(c, term)) : allRows;
  const total = filtered.length;
  const sorted = sortCustomers(filtered, sortBy, sortOrder);

  const safePerPage = Math.max(1, perPage || 25);
  const safePage = Math.max(1, page || 1);
  const offset = (safePage - 1) * safePerPage;
  const paginated = sorted.slice(offset, offset + safePerPage);

  return {
    customers: paginated,
    total,
  };
}
