'use client';
import { ReactNode } from 'react';
import { AuthContext } from './authContextInstance';
import { useAuthSession } from './auth/useAuthSession';
import { useAuthActions } from './auth/useAuthActions';
import { useAuthUsage } from './auth/useAuthUsage';
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    token,
    setToken,
    user,
    setUser,
    loading,
    setLoading,
    showPaywall,
    setShowPaywall,
    refreshUser,
  } = useAuthSession();
  const {
    signupWithGooglePassword,
    loginWithPassword,
    loginWithGoogle,
    logout,
  } = useAuthActions({
    token,
    setToken,
    setUser,
    setLoading,
    setShowPaywall,
  });
  const { trackUsage } = useAuthUsage({
    token,
    user,
    setUser,
    setShowPaywall,
  });
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
