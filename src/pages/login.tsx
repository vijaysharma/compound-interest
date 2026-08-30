import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import GoogleSignInButton from '../components/GoogleSignInButton';
const Login = () => {
  const { isAuthenticated, loginWithPassword, signupWithGooglePassword, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  // Sign In form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  // Sign Up verified Google Profile state
  const [googleProfile, setGoogleProfile] = useState<{
    email: string;
    name?: string;
    picture?: string;
    credential?: string;
  } | null>(null);
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (isAuthenticated) {
      const from =
        (location.state as { from?: { pathname?: string } })?.from?.pathname ||
        '/investment-details';
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
          <h1 className="text-2xl sm:text-3xl font-extrabold">Rupee Calculators Suite</h1>
          <p className="mt-1.5 text-xs sm:text-sm opacity-70">
            Institutional financial suite with live AMFI mutual fund sync &amp; multi-country models.
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
          <div className="space-y-4">
            {!googleProfile ? (
              /* Step 1: Authenticate with Google / Enter Gmail */
              <div className="space-y-4">
                <div className="rounded-xl bg-primary/5 p-3.5 border border-primary/15 space-y-1.5">
                  <div className="text-xs font-bold text-primary uppercase tracking-wider">
                    Step 1 of 2: Verify Your Google / Gmail Account
                  </div>
                  <p className="text-xs opacity-75">
                    Includes 24-hour / 10-calculation access to live Mutual Funds &amp; PPP analytics. Standard calculators in the suite are always free.
                  </p>
                </div>
                <div className="flex justify-center py-1">
                  <GoogleSignInButton
                    text="signup_with"
                    modalTitle="Verify Google Account"
                    onProfileSelect={(p) => {
                      setGoogleProfile(p);
                      setError(null);
                    }}
                    onSuccess={() => {
                      navigate('/investment-details', { replace: true });
                    }}
                  />
                </div>
                <div className="divider text-[11px] uppercase opacity-50 my-1">
                  or continue with email
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const clean =
                      (
                        e.currentTarget.elements.namedItem('direct_gmail') as HTMLInputElement
                      )?.value
                        ?.trim()
                        .toLowerCase() || '';
                    if (
                      !clean ||
                      (!clean.endsWith('@gmail.com') && !clean.endsWith('@googlemail.com'))
                    ) {
                      setError('Only valid @gmail.com or @googlemail.com addresses are permitted.');
                      return;
                    }
                    setError(null);
                    setGoogleProfile({
                      email: clean,
                      name: clean.split('@')[0],
                    });
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label
                      htmlFor="direct-gmail"
                      className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-80"
                    >
                      Gmail Address
                    </label>
                    <input
                      id="direct-gmail"
                      name="direct_gmail"
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      className="input input-bordered input-primary w-full text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-outline btn-primary btn-sm w-full font-semibold"
                  >
                    <span>Continue to Set Password &rarr;</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Create Password for the verified Google Account */
              <form onSubmit={handleCompleteGoogleSignup} className="space-y-4">
                <div className="flex items-center gap-3 p-3.5 bg-success/10 rounded-xl border border-success/30">
                  {googleProfile.picture ? (
                    <img
                      src={googleProfile.picture}
                      alt={googleProfile.name || googleProfile.email}
                      className="w-10 h-10 rounded-full border border-success/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-content font-bold flex items-center justify-center text-sm shrink-0">
                      {googleProfile.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1">
                      <span>✓</span> Verified Google Account
                    </div>
                    <div className="text-xs sm:text-sm font-bold truncate">
                      {googleProfile.email}
                    </div>
                    {googleProfile.name && (
                      <div className="text-[11px] opacity-60 truncate">{googleProfile.name}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleProfile(null);
                      setSignupPassword('');
                      setSignupConfirmPassword('');
                    }}
                    className="btn btn-ghost btn-xs text-[10px] opacity-70 hover:opacity-100 shrink-0"
                  >
                    Change
                  </button>
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
                    autoFocus
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
                      <span>Completing Registration...</span>
                    </>
                  ) : (
                    <span>Register &amp; Unlock Free Access &rarr;</span>
                  )}
                </button>
              </form>
            )}
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
          </div>
        )}
        <div className="mt-8 border-t border-base-200 pt-6 text-center text-xs opacity-60">
          <p>Institutional-grade financial precision. Fast, private, and free.</p>
        </div>
      </div>
    </div>
  );
};
export default Login;
