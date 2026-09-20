'use client';
import { useEffect, useState } from 'react';
import { useNavigate } from '@/navigation';
import { useAuth } from '../../context/useAuth';
import type { PaymentSettings } from '../../types/auth';
import { loadRazorpayScript } from '../../utils/razorpay';
import {
  createRazorpayOrderAction,
  getPaymentSettingsAction,
  verifyRazorpayPaymentAction,
} from '@/actions/payments';
import { resolveThemeToken } from '@/data/chartColors';
export function usePaywallPayment() {
  const { user, showPaywall, setShowPaywall, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  useEffect(() => {
    if (!showPaywall) return;
    const fetchSettings = async () => {
      try {
        const data = await getPaymentSettingsAction();
        setSettings(data.settings);
      } catch (err) {
        console.warn('Failed to load payment settings:', err);
      }
    };
    void fetchSettings();
  }, [showPaywall]);
  const proMonthlyAmount = settings?.amount ?? 54;
  const planId = billingInterval === 'monthly' ? 'pro_monthly' : 'pro_yearly';
  const planAmount = billingInterval === 'monthly' ? proMonthlyAmount : 499;
  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Could not load payment gateway. Please check your internet connection.');
      }
      const storedToken = localStorage.getItem('auth_token');
      const orderData = await createRazorpayOrderAction(storedToken, planId);
      if (!orderData.orderId || !orderData.keyId) {
        throw new Error('Failed to create payment order');
      }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Rupee Calculator Pro',
        description: orderData.planName || 'Pro Subscription',
        order_id: orderData.orderId,
        prefill: {
          email: user?.email || '',
        },
        theme: {
          color: resolveThemeToken('--color-primary'),
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setIsProcessing(true);
            const verifyData = await verifyRazorpayPaymentAction(
              { ...response, plan_id: planId },
              storedToken
            );
            setMessage({
              type: 'success',
              text: verifyData.message || 'Payment successful! Pro access is now active.',
            });
            await refreshUser();
            setTimeout(() => {
              setShowPaywall(false);
              const saved = localStorage.getItem('last_visited_route');
              const target = saved && saved !== '/login' && saved !== '/upgrade' ? saved : '/';
              navigate(target, { replace: true });
            }, 1200);
          } catch (err) {
            setMessage({
              type: 'error',
              text: err instanceof Error ? err.message : 'Verification failed',
            });
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to process payment',
      });
      setIsProcessing(false);
    }
  };
  return {
    user,
    showPaywall,
    setShowPaywall,
    isProcessing,
    message,
    billingInterval,
    setBillingInterval,
    proMonthlyAmount,
    planAmount,
    handleRazorpayPayment,
  };
}
