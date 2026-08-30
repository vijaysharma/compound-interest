import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              type?: 'standard' | 'icon';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
        };
      };
    };
  }
}
interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onProfileSelect?: (profile: {
    email: string;
    name?: string;
    picture?: string;
    credential?: string;
  }) => void;
  className?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  modalTitle?: string;
}
const GoogleIcon = () => (
  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);
const GoogleSignInButton = ({
  onSuccess,
  onProfileSelect,
  className = '',
  text = 'continue_with',
  modalTitle = 'Sign Up with Google',
}: GoogleSignInButtonProps) => {
  const { signupWithGooglePassword, loading } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      Boolean(window.google?.accounts?.id && document.getElementById('google-gsi-script'))
    );
  });
  const buttonRef = useRef<HTMLDivElement>(null);
  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const hasValidClientId =
    typeof rawClientId === 'string' &&
    rawClientId.trim().length > 10 &&
    rawClientId.includes('.apps.googleusercontent.com');
  useEffect(() => {
    if (!hasValidClientId || isSdkLoaded) return;
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      if (!window.google?.accounts?.id) {
        existingScript.addEventListener('load', () => setIsSdkLoaded(true));
      }
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsSdkLoaded(true);
    script.onerror = () => console.warn('Google Identity Services script failed to load');
    document.body.appendChild(script);
  }, [hasValidClientId, isSdkLoaded]);
  useEffect(() => {
    if (!isSdkLoaded || !hasValidClientId || !buttonRef.current || !window.google?.accounts?.id)
      return;
    try {
      window.google.accounts.id.initialize({
        client_id: rawClientId,
        callback: (response) => {
          if (response.credential) {
            let emailFound = '';
            let nameFound = '';
            let pictureFound = '';
            try {
              const parts = response.credential.split('.');
              if (parts.length === 3) {
                const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
                const payload = JSON.parse(payloadJson) as {
                  email?: string;
                  name?: string;
                  picture?: string;
                };
                if (payload.email) emailFound = payload.email;
                if (payload.name) nameFound = payload.name;
                if (payload.picture) pictureFound = payload.picture;
              }
            } catch {
              // fallback
            }
            if (onProfileSelect && emailFound) {
              onProfileSelect({
                email: emailFound,
                name: nameFound,
                picture: pictureFound,
                credential: response.credential,
              });
              return;
            }
            if (emailFound) setEmail(emailFound);
            if (nameFound) setName(nameFound);
            setIsModalOpen(true);
          }
        },
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text,
        logo_alignment: 'left',
        width: 280,
      });
    } catch (err) {
      console.warn('Google GSI button initialization notice:', err);
    }
  }, [isSdkLoaded, hasValidClientId, rawClientId, onProfileSelect, onSuccess, text]);
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
      setIsModalOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/investment-details', { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  const isAdminCandidate =
    email.trim().toLowerCase() === (import.meta.env.VITE_ALLOWED_EMAIL || '').trim().toLowerCase();
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {hasValidClientId ? (
        <div ref={buttonRef} className="min-h-[44px]" />
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="btn btn-outline border-base-300 hover:border-primary flex items-center justify-center gap-3 bg-base-100 px-5 py-2.5 font-medium shadow-sm transition-all text-sm rounded-lg hover:shadow-md cursor-pointer"
        >
          <GoogleIcon />
          <span>Sign up with Google</span>
        </button>
      )}
      {error && !isModalOpen && <p className="text-xs text-error text-center">{error}</p>}
      {/* Interactive Authorization Modal Flow */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className="card bg-base-100 border border-base-300 w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square absolute right-4 top-4 opacity-70 hover:opacity-100"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close dialog"
            >
              <FiX className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-200 border border-base-300">
                <GoogleIcon />
              </div>
              <div>
                <h3 id="auth-modal-title" className="text-lg font-bold">
                  {modalTitle}
                </h3>
                <p className="text-xs opacity-60">
                  Create password to complete Google registration
                </p>
              </div>
            </div>
            {error && (
              <div className="alert alert-error text-xs py-2 px-3 mb-4 rounded-lg">
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleAuthorizeSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="google-email"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
                >
                  Google Account Email
                </label>
                <div className="relative">
                  <input
                    id="google-email"
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com or workspace account"
                    className="input input-bordered input-primary w-full text-sm pl-3 pr-8 focus:outline-none"
                  />
                  {email.includes('@') && (
                    <span className="absolute right-3 top-3 text-success">
                      <FiCheck className="h-4 w-4" />
                    </span>
                  )}
                </div>
                {isAdminCandidate && (
                  <p className="mt-1 text-[11px] text-accent font-medium flex items-center gap-1">
                    Administrator privileges detected for this email
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="google-name"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
                >
                  Display Name <span className="opacity-50 lowercase font-normal">(optional)</span>
                </label>
                <input
                  id="google-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="input input-bordered w-full text-sm focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="google-password"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
                >
                  Create Password
                </label>
                <input
                  id="google-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="input input-bordered input-primary w-full text-sm focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="google-confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
                >
                  Confirm Password
                </label>
                <input
                  id="google-confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="input input-bordered input-primary w-full text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="btn btn-primary btn-sm px-5 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register &amp; Continue</span>
                      <span>&rarr;</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default GoogleSignInButton;
