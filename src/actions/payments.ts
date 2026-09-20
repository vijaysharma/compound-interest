'use server';
import { PaymentSettings, PaymentSubmission } from '@/lib/db';
import { SubscriptionPlanDetails } from '@/types/auth';
import { handleGetPaymentSettings, handleUpdatePaymentSettings } from './payments/paymentSettings';
import { handleCreateRazorpayOrder } from './payments/razorpayOrder';
import { handleVerifyRazorpayPayment } from './payments/razorpayVerify';
import {
  handleGetAdminPaymentSubmissions,
  handleProcessAdminPaymentSubmission,
  handleSubmitManualPayment,
} from './payments/manualSubmissions';
export type { SubscriptionPlanDetails };
export async function getPaymentSettingsAction(): Promise<{ settings: PaymentSettings }> {
  return handleGetPaymentSettings();
}
export async function updatePaymentSettingsAction(
  body: Partial<PaymentSettings>,
  token?: string | null
): Promise<{ success: boolean; settings: PaymentSettings }> {
  return handleUpdatePaymentSettings(body, token);
}
export async function createRazorpayOrderAction(
  token?: string | null,
  planId: string = 'pro_monthly'
): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  planId: string;
  planName: string;
  user: { name: string; email: string };
}> {
  return handleCreateRazorpayOrder(token, planId);
}
export async function verifyRazorpayPaymentAction(
  body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan_id?: string;
  },
  token?: string | null
): Promise<{
  success: boolean;
  message: string;
  subscription_expires_at: string;
  subscription_plan: string;
}> {
  return handleVerifyRazorpayPayment(body, token);
}
export async function submitManualPaymentAction(
  body: { utr_ref?: string; amount?: number },
  token?: string | null
): Promise<{
  success: boolean;
  submission: PaymentSubmission;
  message: string;
}> {
  return handleSubmitManualPayment(body, token);
}
export async function getAdminPaymentSubmissionsAction(token?: string | null): Promise<{
  submissions: (PaymentSubmission & {
    subscription_status: string;
    subscription_expires_at: string | null;
  })[];
}> {
  return handleGetAdminPaymentSubmissions(token);
}
export async function processAdminPaymentSubmissionAction(
  body: {
    submission_id?: string;
    action?: 'approve' | 'reject';
  },
  token?: string | null
): Promise<{ success: boolean; message: string }> {
  return handleProcessAdminPaymentSubmission(body, token);
}
