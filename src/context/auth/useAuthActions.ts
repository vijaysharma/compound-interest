import { Dispatch, SetStateAction } from 'react';
import { AuthUser } from '@/types/auth';
import {
  loginWithGoogleAction,
  loginWithPasswordAction,
  logoutAction,
  signupWithGooglePasswordAction,
} from '@/actions/auth';
interface UseAuthActionsParams {
  token: string | null;
  setToken: Dispatch<SetStateAction<string | null>>;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setShowPaywall: Dispatch<SetStateAction<boolean>>;
}
export function useAuthActions({
  token,
  setToken,
  setUser,
  setLoading,
  setShowPaywall,
}: UseAuthActionsParams) {
  const signupWithGooglePassword = async (data: {
    email: string;
    password: string;
    name?: string;
    credential?: string;
  }) => {
    setLoading(true);
    try {
      const res = await signupWithGooglePasswordAction(data);
      if (!res.token || !res.user) {
        throw new Error('Registration failed');
      }
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      if (res.user.isBlocked) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const loginWithPassword = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await loginWithPasswordAction(data);
      if (!res.token || !res.user) {
        throw new Error('Sign in failed');
      }
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      if (res.user.isBlocked) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const loginWithGoogle = async (
    authData: string | { credential?: string; email?: string; name?: string }
  ) => {
    setLoading(true);
    try {
      const payload = typeof authData === 'string' ? { credential: authData } : authData;
      const res = await loginWithGoogleAction(payload);
      if (!res.token || !res.user) {
        throw new Error('Google authentication failed');
      }
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      if (res.user.isBlocked) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (currentToken) {
      try {
        await logoutAction(currentToken);
      } catch (err) {
        console.warn('Logout action error:', err);
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    try {
      localStorage.removeItem('last_visited_route');
      sessionStorage.setItem('stay_on_home', 'true');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    setShowPaywall(false);
  };
  return {
    signupWithGooglePassword,
    loginWithPassword,
    loginWithGoogle,
    logout,
  };
}
