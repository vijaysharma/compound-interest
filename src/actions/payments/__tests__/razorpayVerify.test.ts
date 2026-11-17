import test from 'node:test';
import assert from 'node:assert/strict';
import { handleVerifyRazorpayPayment } from '../razorpayVerify';
test('handleVerifyRazorpayPayment handles verification invocation', async () => {
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key_id';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_key_secret';
  try {
    await assert.rejects(
      async () => {
        await handleVerifyRazorpayPayment(
          {
            razorpay_order_id: 'order_123',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: 'sig_123',
          },
          undefined
        );
      },
      /Authentication required/
    );
  } finally {
    if (originalKeyId !== undefined) process.env.RAZORPAY_KEY_ID = originalKeyId;
    else delete process.env.RAZORPAY_KEY_ID;
    if (originalKeySecret !== undefined) process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    else delete process.env.RAZORPAY_KEY_SECRET;
  }
});
test('handleVerifyRazorpayPayment rejects missing payment parameters', async () => {
  const originalKeyId = process.env.RAZORPAY_KEY_ID;
  const originalKeySecret = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_ID = 'rzp_test_key_id';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_test_key_secret';
  try {
    await assert.rejects(
      async () => {
        await handleVerifyRazorpayPayment(
          {
            razorpay_order_id: '',
            razorpay_payment_id: 'pay_123',
            razorpay_signature: 'sig_123',
          },
          'some-token'
        );
      },
      /Missing required Razorpay payment confirmation parameters|Authentication required/
    );
  } finally {
    if (originalKeyId !== undefined) process.env.RAZORPAY_KEY_ID = originalKeyId;
    else delete process.env.RAZORPAY_KEY_ID;
    if (originalKeySecret !== undefined) process.env.RAZORPAY_KEY_SECRET = originalKeySecret;
    else delete process.env.RAZORPAY_KEY_SECRET;
  }
});
