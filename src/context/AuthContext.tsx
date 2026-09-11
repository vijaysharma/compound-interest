'use client';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AuthUser } from '../types/auth';
import { AuthContext } from './authContextInstance';
import {
  getMeAction,
  loginWithGoogleAction,
  loginWithPasswordAction,
  logoutAction,
  signupWithGooglePasswordAction,
  trackUsageAction,
} from '@/actions/auth';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  });
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const cached = localStorage.getItem('auth_user');
    if (!cached) return null;
    try {
      return JSON.parse(cached) as AuthUser;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasToken = Boolean(localStorage.getItem('auth_token'));
    const hasUser = Boolean(localStorage.getItem('auth_user'));
    return hasToken && !hasUser;
  });
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const isTrackingRef = useRef(false);
  const refreshUser = useCallback(async () => {
    const storedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (!storedToken) {
      setUser(null);
      return;
    }
    try {
      const res = await getMeAction(storedToken);
      if (res?.user) {
        setUser(res.user);
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        if (res.user.isBlocked) {
          setShowPaywall(true);
        }
      }
    } catch (err) {
      console.warn('Refresh user error:', err);
    }
  }, [token]);
  useEffect(() => {
    let cancelled = false;
    const verifySession = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await getMeAction(storedToken);
        if (cancelled) return;
        if (res?.user) {
          setUser(res.user);
          localStorage.setItem('auth_user', JSON.stringify(res.user));
          if (res.user.isBlocked) {
            setShowPaywall(true);
          }
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void verifySession();
    return () => {
      cancelled = true;
    };
  }, [token]);
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
  const trackUsage = useCallback(
    async (initOnly = false): Promise<boolean> => {
      if (user?.isBlocked) {
        setShowPaywall(true);
        return false;
      }
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
      if (!currentToken || isTrackingRef.current) return true;
      isTrackingRef.current = true;
      try {
        const data = await trackUsageAction(currentToken, initOnly ? 'init' : 'api');
        if (typeof data.api_usage_count === 'number') {
          setUser((prev) => {
            if (!prev) return null;
            const updated = {
              ...prev,
              api_usage_count: data.api_usage_count!,
              freeLimit: data.freeLimit ?? prev.freeLimit,
              isBlocked: Boolean(data.isBlocked),
              first_used_at: data.first_used_at ?? prev.first_used_at,
              trial_expires_at: data.trial_expires_at ?? prev.trial_expires_at,
            };
            localStorage.setItem('auth_user', JSON.stringify(updated));
            return updated;
          });
        }
        if (data.isBlocked) {
          setShowPaywall(true);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Track usage error:', err);
        return true;
      } finally {
        isTrackingRef.current = false;
      }
    },
    [token, user?.isBlocked]
  );
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
  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user && user.role === 'admin');
  const isBlocked = Boolean(user && user.isBlocked);
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signupWithGooglePassword,
        loginWithPassword,
        loginWithGoogle,
        logout,
        trackUsage,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isBlocked,
        showPaywall,
        setShowPaywall,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthProvider;
