import { useState, useCallback, useEffect, FormEvent } from 'react';
import { useLocation, useNavigate } from '@/navigation';
import { useAuth } from '../../context/useAuth';
import { GoogleProfile, LoginTab } from './types';
export function useLoginState() {
  const { isAuthenticated, loginWithPassword, signupWithGooglePassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<LoginTab>('signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [googleProfile, setGoogleProfile] = useState<GoogleProfile | null>(null);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getTargetRoute = useCallback(() => {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('last_visited_route') : null;
    if (from && from !== '/login' && from !== '/upgrade') return from;
    if (saved && saved !== '/login' && saved !== '/upgrade') return saved;
    return '/';
  }, [location.state]);
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getTargetRoute(), { replace: true });
    }
  }, [isAuthenticated, navigate, getTargetRoute]);
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithPassword({ email: cleanEmail, password: loginPassword });
      navigate(getTargetRoute(), { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCompleteGoogleSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!googleProfile?.email) {
      setError('Please authenticate with Google first.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signupWithGooglePassword({
        email: googleProfile.email,
        password: signupPassword,
        name: googleProfile.name,
        credential: googleProfile.credential,
      });
      navigate(getTargetRoute(), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return {
    loading,
    activeTab,
    setActiveTab,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    googleProfile,
    setGoogleProfile,
    signupPassword,
    setSignupPassword,
    signupConfirmPassword,
    setSignupConfirmPassword,
    error,
    setError,
    isSubmitting,
    getTargetRoute,
    handleLogin,
    handleCompleteGoogleSignup,
  };
}
