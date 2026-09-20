import { useState, useCallback, useEffect } from 'react';
import { AuthUser } from '@/types/auth';
import { getMeAction } from '@/actions/auth';
export function useAuthSession() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);
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
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }
      setToken(storedToken);
      const cached = localStorage.getItem('auth_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached) as AuthUser);
        } catch {
          // ignore
        }
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
  }, []);
  return {
    token,
    setToken,
    user,
    setUser,
    loading,
    setLoading,
    showPaywall,
    setShowPaywall,
    refreshUser,
  };
}
