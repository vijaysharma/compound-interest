import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AuthUser } from '../types/auth';
import { AuthContext } from './authContextInstance';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cached = localStorage.getItem('auth_user');
    if (!cached) return null;
    try {
      return JSON.parse(cached) as AuthUser;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
  const isTrackingRef = useRef(false);
  const refreshUser = useCallback(async () => {
    const storedToken = token || localStorage.getItem('auth_token');
    if (!storedToken) {
      setUser(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { user: AuthUser };
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        if (data.user.isBlocked) {
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
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { user: AuthUser };
          setUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          if (data.user.isBlocked) {
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = (await res.json()) as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok || !resData.token || !resData.user) {
        throw new Error(resData.error ?? 'Registration failed');
      }
      localStorage.setItem('auth_token', resData.token);
      localStorage.setItem('auth_user', JSON.stringify(resData.user));
      setToken(resData.token);
      setUser(resData.user);
      if (resData.user.isBlocked) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const loginWithPassword = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = (await res.json()) as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok || !resData.token || !resData.user) {
        throw new Error(resData.error ?? 'Sign in failed');
      }
      localStorage.setItem('auth_token', resData.token);
      localStorage.setItem('auth_user', JSON.stringify(resData.user));
      setToken(resData.token);
      setUser(resData.user);
      if (resData.user.isBlocked) {
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
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error ?? 'Google authentication failed');
      }
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      if (data.user.isBlocked) {
        setShowPaywall(true);
      }
    } finally {
      setLoading(false);
    }
  };
  const trackUsage = useCallback(async (): Promise<boolean> => {
    if (user?.isBlocked) {
      setShowPaywall(true);
      return false;
    }
    const currentToken = token || localStorage.getItem('auth_token');
    if (!currentToken || isTrackingRef.current) return true;
    isTrackingRef.current = true;
    try {
      const res = await fetch('/api/user/track-usage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = (await res.json()) as {
        success?: boolean;
        isBlocked?: boolean;
        api_usage_count?: number;
      };
      if (typeof data.api_usage_count === 'number') {
        setUser((prev) => {
          if (!prev) return null;
          const updated = {
            ...prev,
            api_usage_count: data.api_usage_count!,
            isBlocked: Boolean(data.isBlocked),
          };
          localStorage.setItem('auth_user', JSON.stringify(updated));
          return updated;
        });
      }
      if (data.isBlocked || res.status === 402) {
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
  }, [token, user?.isBlocked]);
  const logout = async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
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
