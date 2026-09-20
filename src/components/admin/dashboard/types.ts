export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  free_limit: number;
  subscription_status: string;
  subscription_expires_at: string | null;
  first_used_at: string | null;
  trial_expires_at: string | null;
  created_at: string;
}
export type TabType = 'payments' | 'submissions' | 'users' | 'sync' | 'ai';
export interface AlertMessage {
  type: 'success' | 'error';
  text: string;
}
