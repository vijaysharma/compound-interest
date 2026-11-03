import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchCustomer,
  sortCustomers,
  filterAndPaginateCustomers,
} from '../shiprocketCustomerFilter';
import type { DbShiprocketCustomer } from '@/lib/db/types';

const mockCustomers: DbShiprocketCustomer[] = [
  {
    id: 'cust-1',
    customer_name: 'Aarav Sharma',
    customer_phone: '9876543210',
    customer_phone_2: '9123456780',
    customer_email: 'aarav@example.com',
    customer_address: '123 MG Road, Flat 4B',
    customer_address_2: 'Near Metro Station',
    customer_city: 'Bengaluru',
    customer_state: 'Karnataka',
    customer_pincode: '560001',
    dedup_key: 'aarav sharma|560001',
    total_orders: 5,
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-06-15T12:00:00Z',
  },
  {
    id: 'cust-2',
    customer_name: 'Priya Patel',
    customer_phone: '8765432109',
    customer_phone_2: null,
    customer_email: 'priya.patel@test.org',
    customer_address: '45 SV Road',
    customer_address_2: null,
    customer_city: 'Mumbai',
    customer_state: 'Maharashtra',
    customer_pincode: '400050',
    dedup_key: 'priya patel|400050',
    total_orders: 12,
    created_at: '2023-11-05T08:30:00Z',
    updated_at: '2024-08-20T14:15:00Z',
  },
  {
    id: 'cust-3',
    customer_name: 'Rohan Gupta',
    customer_phone: '7654321098',
    customer_phone_2: '9988776655',
    customer_email: null,
    customer_address: '78 Sector 18',
    customer_address_2: 'Near Market',
    customer_city: 'Noida',
    customer_state: 'Uttar Pradesh',
    customer_pincode: '201301',
    dedup_key: 'rohan gupta|201301',
    total_orders: 2,
    created_at: '2024-03-22T11:00:00Z',
    updated_at: '2024-04-01T09:00:00Z',
  },
];

test('matchCustomer matches customer name case-insensitively', () => {
  assert.equal(matchCustomer(mockCustomers[0], 'aarav'), true);
  assert.equal(matchCustomer(mockCustomers[0], 'AARAV'), true);
  assert.equal(matchCustomer(mockCustomers[0], 'sharma'), true);
  assert.equal(matchCustomer(mockCustomers[0], 'Priya'), false);
});

test('matchCustomer matches customer phone numbers and alternate phones', () => {
  assert.equal(matchCustomer(mockCustomers[0], '9876543210'), true);
  assert.equal(matchCustomer(mockCustomers[0], '9123456780'), true); // alt phone
  // Formatted query with spaces and country code should match numeric digits
  assert.equal(matchCustomer(mockCustomers[0], '+91 98765 43210'), true);
  assert.equal(matchCustomer(mockCustomers[2], '9988776655'), true); // rohan alt phone
});

test('matchCustomer matches email, address, city, state, and pincode', () => {
  // Email
  assert.equal(matchCustomer(mockCustomers[1], 'priya.patel'), true);
  // Address 1 & 2
  assert.equal(matchCustomer(mockCustomers[0], 'MG Road'), true);
  assert.equal(matchCustomer(mockCustomers[0], 'Metro Station'), true);
  // City
  assert.equal(matchCustomer(mockCustomers[0], 'Bengaluru'), true);
  assert.equal(matchCustomer(mockCustomers[2], 'noida'), true);
  // State
  assert.equal(matchCustomer(mockCustomers[1], 'Maharashtra'), true);
  // Pincode
  assert.equal(matchCustomer(mockCustomers[2], '201301'), true);
});

test('matchCustomer handles null and missing fields gracefully', () => {
  const minimalCustomer: DbShiprocketCustomer = {
    id: 'cust-min',
    customer_name: 'Minimal User',
    customer_phone: '1234567890',
    customer_address: '',
    customer_city: '',
    customer_state: '',
    customer_pincode: '',
    dedup_key: 'min|0',
    total_orders: 0,
    created_at: '',
    updated_at: '',
  };
  assert.equal(matchCustomer(minimalCustomer, 'Minimal'), true);
  assert.equal(matchCustomer(minimalCustomer, 'nonexistent'), false);
});

test('sortCustomers sorts by name, orders, and dates', () => {
  // Name asc
  const byNameAsc = sortCustomers(mockCustomers, 'name', 'asc');
  assert.equal(byNameAsc[0].customer_name, 'Aarav Sharma');
  assert.equal(byNameAsc[2].customer_name, 'Rohan Gupta');

  // Name desc
  const byNameDesc = sortCustomers(mockCustomers, 'name', 'desc');
  assert.equal(byNameDesc[0].customer_name, 'Rohan Gupta');
  assert.equal(byNameDesc[2].customer_name, 'Aarav Sharma');

  // Orders desc
  const byOrdersDesc = sortCustomers(mockCustomers, 'orders', 'desc');
  assert.equal(byOrdersDesc[0].customer_name, 'Priya Patel'); // 12 orders
  assert.equal(byOrdersDesc[2].customer_name, 'Rohan Gupta'); // 2 orders
});

test('filterAndPaginateCustomers filters by search term and paginates correctly', () => {
  // Empty search returns all
  const all = filterAndPaginateCustomers(mockCustomers, { search: '' });
  assert.equal(all.total, 3);
  assert.equal(all.customers.length, 3);

  // Whitespace-only search returns all
  const whitespace = filterAndPaginateCustomers(mockCustomers, { search: '   ' });
  assert.equal(whitespace.total, 3);

  // Search by name
  const filtered = filterAndPaginateCustomers(mockCustomers, { search: 'Priya' });
  assert.equal(filtered.total, 1);
  assert.equal(filtered.customers[0].customer_name, 'Priya Patel');

  // Pagination (page 1, perPage 2)
  const page1 = filterAndPaginateCustomers(mockCustomers, { page: 1, perPage: 2 });
  assert.equal(page1.total, 3);
  assert.equal(page1.customers.length, 2);

  // Pagination (page 2, perPage 2)
  const page2 = filterAndPaginateCustomers(mockCustomers, { page: 2, perPage: 2 });
  assert.equal(page2.total, 3);
  assert.equal(page2.customers.length, 1);

  // Search yielding no results
  const noMatch = filterAndPaginateCustomers(mockCustomers, { search: 'NonExistentPerson12345' });
  assert.equal(noMatch.total, 0);
  assert.equal(noMatch.customers.length, 0);
});
