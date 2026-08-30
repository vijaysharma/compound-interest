export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  subscription_status: 'free_trial' | 'active' | 'expired';
  subscription_expires_at: string | null;
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
  trackUsage: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
}
