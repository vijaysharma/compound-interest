export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  subscription_status: 'free_trial' | 'active' | 'expired';
  subscription_expires_at: string | null;
  subscription_plan?: string | null;
  first_used_at?: string | null;
  trial_expires_at?: string | null;
  isBlocked: boolean;
  freeLimit: number;
}
export interface PaymentSettings {
  id: string;
  title: string;
  upi_id: string;
  upi_qr_code_url: string;
  amount: number;
  instructions: string;
  updated_at: string;
}
export interface PaymentSubmission {
  id: string;
  user_id: string;
  user_email: string;
  utr_ref: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
}
export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signupWithGooglePassword: (data: {
    email: string;
    password: string;
    name?: string;
    credential?: string;
  }) => Promise<void>;
  loginWithPassword: (data: { email: string; password: string }) => Promise<void>;
  loginWithGoogle: (
    authData: string | { credential?: string; email?: string; name?: string }
  ) => Promise<void>;
  logout: () => Promise<void>;
  trackUsage: (initOnly?: boolean) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
}
export interface SubscriptionPlanDetails {
  id: string;
  name: string;
  amount: number;
  period: 'month' | 'year';
  days: number;
  description: string;
  tier: 'pro' | 'tax_pro';
}
export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanDetails> = {
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    amount: 54,
    period: 'month',
    days: 30,
    description: '30 Days Unlimited Pro Access',
    tier: 'pro',
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    amount: 499,
    period: 'year',
    days: 365,
    description: '365 Days Unlimited Pro Access (Save 23%)',
    tier: 'pro',
  },
  tax_monthly: {
    id: 'tax_monthly',
    name: 'Tax Pro Monthly',
    amount: 129,
    period: 'month',
    days: 30,
    description: '30 Days Pro + Personalized Tax Strategy & Advisory Engine',
    tier: 'tax_pro',
  },
  tax_yearly: {
    id: 'tax_yearly',
    name: 'Tax Pro Yearly',
    amount: 999,
    period: 'year',
    days: 365,
    description: '365 Days Pro + Personalized Tax Strategy & Advisory Engine (Save 35%)',
    tier: 'tax_pro',
  },
};
