import { useState, useEffect } from 'react';
import { useNavigate } from '@/navigation';
import { useAuth } from '../../context/useAuth';
import { PaymentSettings, SUBSCRIPTION_PLANS } from '../../types/auth';
import { loadRazorpayScript } from '../../utils/razorpay';
import {
  createRazorpayOrderAction,
  getPaymentSettingsAction,
  verifyRazorpayPaymentAction,
} from '@/actions/payments';
import {
  calculateRemainingTime,
  getProPlanDetails,
  getTaxPlanDetails,
} from './upgradeUtils';
export function useUpgradePayment() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeProcessingPlan, setActiveProcessingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getPaymentSettingsAction();
        setSettings(data.settings);
      } catch (err) {
        console.warn('Failed to fetch settings:', err);
      }
    };
    void fetchSettings();
  }, []);
  const proMonthlyAmount = settings?.amount ?? SUBSCRIPTION_PLANS.pro_monthly.amount;
  const isTrialActive =
    user && !user.isBlocked && user.role !== 'admin' && user.subscription_status !== 'active';
  const remainingCalculations = Math.max(0, (user?.freeLimit || 15) - (user?.api_usage_count || 0));
  const remainingTimeStr = calculateRemainingTime(user?.trial_expires_at);
  const handleRazorpayPayment = async (planId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/upgrade' } } });
      return;
    }
    setIsProcessing(true);
    setActiveProcessingPlan(planId);
    setMessage(null);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Could not load payment gateway. Please check your internet connection.');
      }
      const storedToken = localStorage.getItem('auth_token');
      const orderData = await createRazorpayOrderAction(storedToken, planId);
      if (!orderData.orderId || !orderData.keyId) {
        throw new Error('Failed to initialize payment gateway');
      }
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Rupee Calculator',
        description: orderData.planName || 'Pro Subscription',
        order_id: orderData.orderId,
        prefill: {
          name: orderData.user?.name || user?.name || '',
          email: orderData.user?.email || user?.email || '',
        },
        theme: {
          color: planId.startsWith('tax') ? 'var(--color-warning)' : 'var(--color-success)',
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
              text: verifyData.message || 'Payment successful! Your subscription has been activated.',
            });
            await refreshUser();
            setTimeout(() => {
              const saved = localStorage.getItem('last_visited_route');
              const target = saved && saved !== '/login' && saved !== '/upgrade' ? saved : '/';
              navigate(target, { replace: true });
            }, 1500);
          } catch (err) {
            setMessage({
              type: 'error',
              text: err instanceof Error ? err.message : 'Payment verification failed',
            });
          } finally {
            setIsProcessing(false);
            setActiveProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setActiveProcessingPlan(null);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to initiate payment. Please try again.',
      });
      setIsProcessing(false);
      setActiveProcessingPlan(null);
    }
  };
  const isMonthly = billingInterval === 'monthly';
  const proPlan = getProPlanDetails(proMonthlyAmount, isMonthly);
  const taxPlan = getTaxPlanDetails(isMonthly);
  return {
    user,
    isProcessing,
    activeProcessingPlan,
    message,
    billingInterval,
    setBillingInterval,
    isTrialActive,
    remainingCalculations,
    remainingTimeStr,
    proPlan,
    taxPlan,
    handleRazorpayPayment,
  };
}
