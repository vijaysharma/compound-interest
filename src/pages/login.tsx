import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
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
  const { isAuthenticated, loginWithPassword, signupWithGooglePassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  // Sign In form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // Sign Up form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/investment-details';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);
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
      navigate('/investment-details', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = signupEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid Google account email address.');
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
        email: cleanEmail,
        password: signupPassword,
        name: signupName.trim() || cleanEmail.split('@')[0],
      });
      navigate('/investment-details', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4 py-8">
      <div className="card bg-base-100 border border-base-300 w-full max-w-lg p-6 sm:p-10 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3">
            <Logo />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Rupee Calculator</h1>
          <p className="mt-1.5 text-xs sm:text-sm opacity-70">
            Institutional financial intelligence with real-time AMFI mutual fund analytics.
          </p>
        </div>
        {/* Tab Switcher */}
        <div className="tabs tabs-boxed mb-6 p-1 bg-base-200 grid grid-cols-2">
          <button
            type="button"
            className={`tab ${activeTab === 'signin' ? 'tab-active font-bold' : ''}`}
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'signup' ? 'tab-active font-bold' : ''}`}
            onClick={() => {
              setActiveTab('signup');
              setError(null);
            }}
          >
            Sign Up with Google
          </button>
        </div>
        {error && (
          <div className="alert alert-error text-xs py-2.5 px-4 mb-6 rounded-lg shadow-sm">
            <span>{error}</span>
          </div>
        )}
        {activeTab === 'signin' ? (
          /* Sign In Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Email Address
              </label>
              <input
                id="signin-email"
                type="email"
                required
                autoFocus
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="input input-bordered input-primary w-full text-sm focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="signin-password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="input input-bordered input-primary w-full text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn btn-primary w-full shadow-md font-semibold mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In with Password &rarr;</span>
              )}
            </button>
            <div className="pt-2 text-center text-xs opacity-75">
              <span>New to Rupee Calculator? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                }}
                className="text-primary font-bold hover:underline"
              >
                Sign Up with Google &rarr;
              </button>
            </div>
          </form>
        ) : (
          /* Sign Up with Google Form */
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-3 text-xs text-primary font-medium flex items-center gap-2">
              <GoogleIcon />
              <span>Sign up with your Google account and create a secure login password.</span>
            </div>
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Google Account Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoFocus
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="e.g. name@gmail.com or Workspace"
                className="input input-bordered input-primary w-full text-sm focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Display Name <span className="opacity-50 lowercase font-normal">(optional)</span>
              </label>
              <input
                id="signup-name"
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                className="input input-bordered w-full text-sm focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Create Account Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="input input-bordered input-primary w-full text-sm focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80"
              >
                Confirm Password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                required
                minLength={6}
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="input input-bordered input-primary w-full text-sm focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn btn-primary w-full shadow-md font-semibold mt-2"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register &amp; Unlock Free Access &rarr;</span>
              )}
            </button>
            <div className="pt-2 text-center text-xs opacity-75">
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                }}
                className="text-primary font-bold hover:underline"
              >
                Sign In with Password &rarr;
              </button>
            </div>
          </form>
        )}
        <div className="mt-8 border-t border-base-200 pt-6 text-center text-xs opacity-60">
          <p>Institutional-grade financial precision. Fast, private, and free.</p>
        </div>
      </div>
    </div>
  );
};
export default Login;
