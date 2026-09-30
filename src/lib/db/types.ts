import { neon } from '@neondatabase/serverless';
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
  user_alias?: string | null;
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
export interface DbInstitutionalFlow {
  trade_date: string;
  fii_buy_crores: number | string;
  fii_sell_crores: number | string;
  fii_net_crores: number | string;
  dii_buy_crores: number | string;
  dii_sell_crores: number | string;
  dii_net_crores: number | string;
}
export interface DbIndexPrice {
  trade_date: string;
  index_name: 'NIFTY50' | 'SENSEX';
  close_price: number | string;
}
export interface DbMacroIndicator {
  record_date: string;
  cpi_index: number | string;
  ppp_factor: number | string;
}
export interface DbShiprocketAccount {
  id: string;
  account_label: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  api_email: string;
  api_password?: string;
  auth_token?: string | null;
  token_expires_at?: string | null;
  sr_user_id?: number | null;
  sr_company_id?: number | null;
  sr_first_name?: string | null;
  sr_last_name?: string | null;
  is_active: boolean;
  balance?: number | string | null;
  created_at: string;
  updated_at: string;
}
export interface DbShiprocketCustomer {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_phone_2?: string | null;
  customer_email?: string | null;
  customer_address: string;
  customer_address_2?: string | null;
  customer_city: string;
  customer_state: string;
  customer_pincode: string;
  dedup_key: string;
  source_account_ids?: string[];
  total_orders: number;
  last_order_id?: string | null;
  last_order_date?: string | null;
  created_at: string;
  updated_at: string;
}
