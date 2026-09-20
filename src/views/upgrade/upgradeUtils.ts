import { SUBSCRIPTION_PLANS } from '../../types/auth';
import { PlanDetails } from './types';
export const calculateRemainingTime = (trialExpiresAt?: string | null): string | null => {
  if (!trialExpiresAt) return null;
  const diff = new Date(trialExpiresAt).getTime() - Date.now();
  if (diff <= 0) return '0m';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};
export const getProPlanDetails = (
  proMonthlyAmount: number,
  isMonthly: boolean
): PlanDetails => {
  return isMonthly
    ? { id: 'pro_monthly', price: proMonthlyAmount, period: '/ 30 Days', savings: null }
    : {
        id: 'pro_yearly',
        price: SUBSCRIPTION_PLANS.pro_yearly.amount,
        period: '/ Year',
        savings: 'Save 23% (₹41.5/mo)',
      };
};
export const getTaxPlanDetails = (isMonthly: boolean): PlanDetails => {
  return isMonthly
    ? { id: 'tax_monthly', price: SUBSCRIPTION_PLANS.tax_monthly.amount, period: '/ 30 Days', savings: null }
    : {
        id: 'tax_yearly',
        price: SUBSCRIPTION_PLANS.tax_yearly.amount,
        period: '/ Year',
        savings: 'Save 35% (₹83/mo)',
      };
};
