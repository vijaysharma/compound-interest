'use server';
import { AuthUser } from '@/types/auth';
import { handleSignupWithGooglePassword } from './auth/googleSignup';
import { handleLoginWithGoogle, handleLoginWithPassword } from './auth/loginHandlers';
import { handleGetMe, handleLogout, handleTrackUsage } from './auth/sessionAndUsage';
export async function signupWithGooglePasswordAction(data: {
  email: string;
  password: string;
  name?: string;
  credential?: string;
}): Promise<{ token: string; user: AuthUser }> {
  return handleSignupWithGooglePassword(data);
}
export async function loginWithPasswordAction(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  return handleLoginWithPassword(data);
}
export async function loginWithGoogleAction(authData: {
  credential?: string;
  email?: string;
  name?: string;
}): Promise<{ token: string; user: AuthUser }> {
  return handleLoginWithGoogle(authData);
}
export async function getMeAction(token?: string | null): Promise<{ user: AuthUser } | null> {
  return handleGetMe(token);
}
export async function trackUsageAction(
  token: string | null | undefined,
  type: 'init' | 'api' = 'api'
): Promise<{
  success: boolean;
  isBlocked: boolean;
  api_usage_count?: number;
  freeLimit?: number;
  first_used_at?: string | null;
  trial_expires_at?: string | null;
}> {
  return handleTrackUsage(token, type);
}
export async function logoutAction(token?: string | null): Promise<void> {
  return handleLogout(token);
}
