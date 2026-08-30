import { ReactNode, useEffect, useState } from 'react';
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
    } finally {
      setLoading(false);
    }
  };
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
  };
  const isAuthenticated = Boolean(user && token);
  const isAdmin = Boolean(user && user.role === 'admin');
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogle,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
