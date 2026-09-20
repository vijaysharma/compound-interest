'use client';
import { FormEvent, useState } from 'react';
import { useNavigate } from '@/navigation';
import { useAuth } from '../../context/useAuth';
interface UseGoogleRegistrationProps {
  initialEmail: string;
  initialName: string;
  onSuccess?: () => void;
  onClose: () => void;
}
export function useGoogleRegistration({
  initialEmail,
  initialName,
  onSuccess,
  onClose,
}: UseGoogleRegistrationProps) {
  const { signupWithGooglePassword, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAuthorizeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google account email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signupWithGooglePassword({
        email: cleanEmail,
        password,
        name: name.trim() || cleanEmail.split('@')[0],
      });
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        const saved = localStorage.getItem('last_visited_route');
        const target = saved && saved !== '/login' && saved !== '/upgrade' ? saved : '/';
        navigate(target, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  const allowedEmail = (
    process.env.NEXT_PUBLIC_ALLOWED_EMAIL ||
    process.env.NEXT_PUBLIC_VITE_ALLOWED_EMAIL ||
    ''
  ).trim().toLowerCase();
  const isAdminCandidate = email.trim().toLowerCase() === allowedEmail;
  return {
    email,
    setEmail,
    name,
    setName,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    isSubmitting,
    loading,
    isAdminCandidate,
    handleAuthorizeSubmit,
  };
}
