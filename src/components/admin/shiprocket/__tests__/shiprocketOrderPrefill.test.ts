import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatAccountContactEmail,
  buildOrderPrefillFromCustomer,
} from '../shiprocketOrderPrefill';
import type { ShiprocketCustomer } from '@/types/shiprocket';

describe('Shiprocket Order Prefill & Email Formatting', () => {
  describe('formatAccountContactEmail', () => {
    it('removes all dots from the local-part before @', () => {
      assert.strictEqual(
        formatAccountContactEmail('radha.gopal@gmail.com'),
        'radhagopal@gmail.com'
      );
      assert.strictEqual(
        formatAccountContactEmail('john.doe.orders@example.com'),
        'johndoeorders@example.com'
      );
      assert.strictEqual(
        formatAccountContactEmail('a.b.c.d.e@domain.org'),
        'abcde@domain.org'
      );
    });

    it('preserves dots in domain-part after @', () => {
      assert.strictEqual(
        formatAccountContactEmail('contact.person@mail.company.co.in'),
        'contactperson@mail.company.co.in'
      );
      assert.strictEqual(
        formatAccountContactEmail('sales@sub.example.com'),
        'sales@sub.example.com'
      );
    });

    it('leaves email untouched if local-part already contains no dots', () => {
      assert.strictEqual(
        formatAccountContactEmail('support@gmail.com'),
        'support@gmail.com'
      );
      assert.strictEqual(
        formatAccountContactEmail('admin123@domain.com'),
        'admin123@domain.com'
      );
    });

    it('returns empty string if contact email is empty, null, undefined, or whitespace', () => {
      assert.strictEqual(formatAccountContactEmail(''), '');
      assert.strictEqual(formatAccountContactEmail(null), '');
      assert.strictEqual(formatAccountContactEmail(undefined), '');
      assert.strictEqual(formatAccountContactEmail('   '), '');
    });

    it('returns empty string if email is malformed (no @ symbol or @ at start)', () => {
      assert.strictEqual(formatAccountContactEmail('plainaddress'), '');
      assert.strictEqual(formatAccountContactEmail('@nodomain.com'), '');
    });
  });

  describe('buildOrderPrefillFromCustomer', () => {
    it('prefills customer details and formatted contact email', () => {
      const mockCustomer: Partial<ShiprocketCustomer> = {
        customer_name: 'Anil Kumar',
        customer_phone: '+91 98765 43210',
        customer_email: 'anil.personal@yahoo.com', // Should NOT be used for Email field
        customer_address: 'Flat 402, Sunshine Apartments',
        customer_address_2: 'Near Metro Station',
        customer_pincode: '560001',
        customer_city: 'Bengaluru',
        customer_state: 'Karnataka',
        source_account_ids: ['acc_123'],
      };

      const accountEmail = 'store.admin.hq@retailer.com';
      const prefill = buildOrderPrefillFromCustomer(mockCustomer, accountEmail);

      assert.strictEqual(prefill.name, 'Anil Kumar');
      assert.strictEqual(prefill.phone, '9876543210');
      // Email must come from formatted account contact email, NOT customer email
      assert.strictEqual(prefill.email, 'storeadminhq@retailer.com');
      assert.strictEqual(prefill.address, 'Flat 402, Sunshine Apartments');
      assert.strictEqual(prefill.address2, 'Near Metro Station');
      assert.strictEqual(prefill.pincode, '560001');
      assert.strictEqual(prefill.city, 'Bengaluru');
      assert.strictEqual(prefill.state, 'Karnataka');
      assert.strictEqual(prefill.accountId, 'acc_123');
    });

    it('leaves email empty when account contact email is empty or null', () => {
      const mockCustomer: Partial<ShiprocketCustomer> = {
        customer_name: 'Priya Sharma',
        customer_phone: '9812345678',
        customer_email: 'priya@example.com',
        customer_address: '123 Main Road',
        customer_pincode: '110001',
        customer_city: 'New Delhi',
        customer_state: 'Delhi',
      };

      const prefill = buildOrderPrefillFromCustomer(mockCustomer, null);
      assert.strictEqual(prefill.name, 'Priya Sharma');
      assert.strictEqual(prefill.phone, '9812345678');
      assert.strictEqual(prefill.email, '');
    });
  });
});
