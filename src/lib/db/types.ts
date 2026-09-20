import { neon } from '@neondatabase/serverless';
export const MF_URL = 'https://api.mfapi.in/mf';
export const IMF_URL = 'https://www.imf.org/external/datamapper/api/v1/PCPIPCH/IND/USA/EU/WEOWORLD';
export const FREE_USAGE_LIMIT = 15;
export const TRIAL_DURATION_HOURS = 48;
export type Query = ReturnType<typeof neon>;
export interface DbUser {
  id: string;
  email: string;
  password_hash?: string | null;
  password_salt?: string | null;
  name: string | null;
  picture: string | null;
  provider: string;
  provider_id: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  free_limit?: number;
  subscription_status: 'free_trial' | 'active' | 'expired';
  subscription_expires_at: string | null;
  subscription_plan?: string | null;
  first_used_at?: string | null;
  trial_expires_at?: string | null;
  created_at: string;
  updated_at: string;
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
}
export interface AISettings {
  id: string;
  enabled: boolean;
  provider: string;
  model: string;
  api_key: string;
  system_prompt: string;
  updated_at: string;
}
