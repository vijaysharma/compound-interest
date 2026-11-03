import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyRazorpaySignature } from '../razorpaySignature';

test('verifyRazorpaySignature verifies valid signature', async () => {
  const secret = 'rzp_test_secret_12345';
  const orderId = 'order_DA291048201';
  const paymentId = 'pay_9812491294';

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = enc.encode(`${orderId}|${paymentId}`);
  const signatureBytes = await crypto.subtle.sign('HMAC', key, data);
  const validSignature = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const isValid = await verifyRazorpaySignature(orderId, paymentId, validSignature, secret);
  assert.equal(isValid, true);
});

test('verifyRazorpaySignature rejects tampered order or payment ID', async () => {
  const secret = 'rzp_test_secret_12345';
  const orderId = 'order_DA291048201';
  const paymentId = 'pay_9812491294';

  const isTampered = await verifyRazorpaySignature('order_TAMPERED', paymentId, 'invalidsig', secret);
  assert.equal(isTampered, false);
});
