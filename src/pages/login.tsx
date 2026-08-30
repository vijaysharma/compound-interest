import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Logo from '../components/Logo';
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
const Login = () => {
  const { isAuthenticated, loginWithGoogle, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/investment-details', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const handleAuthorize = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google account email address.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await loginWithGoogle({
        email: cleanEmail,
        name: name.trim() || cleanEmail.split('@')[0],
      });
      navigate('/investment-details', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authorization failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  const isAdminCandidate =
    email.trim().toLowerCase() ===
    (import.meta.env.VITE_ALLOWED_EMAIL || '').trim().toLowerCase();
  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const hasValidClientId =
    typeof rawClientId === 'string' &&
    rawClientId.trim().length > 10 &&
    rawClientId.includes('.apps.googleusercontent.com');
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="card bg-base-100 border border-base-300 w-full max-w-lg p-6 sm:p-10 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <Logo />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Sign in with Google</h1>
          <p className="mt-2 text-sm opacity-70 max-w-sm">
            Authorize your Google account to unlock institutional financial calculators and real-time AMFI data.
          </p>
        </div>
        {error && (
          <div className="alert alert-error text-xs py-2.5 px-4 mb-6 rounded-lg shadow-sm">
            <span>{error}</span>
          </div>
        )}
        {hasValidClientId && (
          <div className="mb-6 flex flex-col items-center">
            <GoogleSignInButton
              text="continue_with"
              onSuccess={() => navigate('/investment-details', { replace: true })}
              className="w-full"
            />
            <div className="divider my-4 text-xs opacity-50 uppercase">or authorize via account</div>
          </div>
        )}
        <form onSubmit={handleAuthorize} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Google Account Email
            </label>
            <div className="relative">
              <input
                id="login-email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@gmail.com or Google Workspace"
                className="input input-bordered input-primary w-full text-sm pl-3 pr-8 focus:outline-none"
              />
              {email.includes('@') && (
                <span className="absolute right-3 top-3 text-success text-xs">✓</span>
              )}
            </div>
            {isAdminCandidate && (
              <p className="mt-1.5 text-[11px] text-accent font-medium flex items-center gap-1">
                ⚡ Administrator privileges detected for this email
              </p>
            )}
          </div>
          <div>
            <label htmlFor="login-name" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
              Display Name <span className="opacity-50 lowercase font-normal">(optional)</span>
            </label>
            <input
              id="login-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Sharma"
              className="input input-bordered w-full text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="btn btn-primary w-full flex items-center justify-center gap-3 py-3 shadow-md hover:shadow-primary/30 transition-all font-semibold"
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                <span>Authorizing Google Account...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Authorize &amp; Sign In</span>
              </>
            )}
          </button>
        </form>
        <div className="mt-6 rounded-lg bg-base-200/50 p-3.5 border border-base-300/60 text-xs opacity-75 space-y-1.5">
          <div className="font-semibold text-primary flex items-center gap-1">
            🔒 Direct &amp; Private Session
          </div>
          <p>
            Your account is verified directly with the secure backend session store. No external tracking or data sharing.
          </p>
        </div>
        <div className="mt-8 border-t border-base-200 pt-6 text-center text-xs opacity-60">
          <p>Institutional-grade financial precision. Fast, private, and free.</p>
        </div>
      </div>
    </div>
  );
};
export default Login;
