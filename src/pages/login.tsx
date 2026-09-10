import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import Logo from '../components/Logo';
import GoogleSignInButton from '../components/GoogleSignInButton';
import SEOHead from '../components/SEOHead';
import styles from './Login.module.scss';
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
  const getTargetRoute = useCallback(() => {
    const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
    const saved = localStorage.getItem('last_visited_route');
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
  return (
    <div className={styles.pageWrapper}>
      <SEOHead
        title="Sign In | Rupee Calculator"
        description="Sign in to your Rupee Calculator account to manage your pro subscription, saved mutual fund portfolios, and economic models."
        canonicalPath="/login"
        noIndex={true}
      />
      <div className={styles.card}>
        <div className={styles.brandHeader}>
          <div className={styles.brandLogo}>
            <Logo />
          </div>
          <h1 className={styles.brandTitle}>Rupee Calculators Suite</h1>
          <p className={styles.brandSubtitle}>
            Institutional financial suite with live AMFI mutual fund sync &amp; multi-country
            models.
          </p>
        </div>
        {/* Tab Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'signin' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('signin');
              setError(null);
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'signup' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('signup');
              setError(null);
            }}
          >
            Sign Up with Google
          </button>
        </div>
        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}
        {activeTab === 'signin' ? (
          /* Sign In Form */
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label
                htmlFor="signin-email"
                className={styles.fieldLabel}
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
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label
                htmlFor="signin-password"
                className={styles.fieldLabel}
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
                className={styles.input}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={styles.primaryBtn}
            >
              {isSubmitting ? (
                <>
                  <span className={styles.spinner} />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In with Password &rarr;</span>
              )}
            </button>
            <div className={styles.footerLinkText}>
              <span>New to Rupee Calculator? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                }}
                className={styles.linkBtn}
              >
                Sign Up with Google &rarr;
              </button>
            </div>
          </form>
        ) : (
          /* Sign Up with Google Form */
          <div className={styles.form}>
            {!googleProfile ? (
              /* Step 1: Authenticate with Google / Enter Gmail */
              <div className={styles.form}>
                <div className={styles.stepCard}>
                  <div className={styles.stepEyebrow}>
                    Step 1 of 2: Verify Your Google / Gmail Account
                  </div>
                  <p className={styles.stepDesc}>
                    Includes 48-hour trial with 15 live Mutual Fund, Inflation &amp; PPP calculation
                    runs. Suite tools remain free post-48 hours.
                  </p>
                </div>
                <div className={styles.googleBtnWrapper}>
                  <GoogleSignInButton
                    text="signup_with"
                    modalTitle="Verify Google Account"
                    onProfileSelect={(p) => {
                      setGoogleProfile(p);
                      setError(null);
                    }}
                    onSuccess={() => {
                      navigate(getTargetRoute(), { replace: true });
                    }}
                  />
                </div>
                <div className={styles.divider}>
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
                  className={styles.formTight}
                >
                  <div className={styles.field}>
                    <label
                      htmlFor="direct-gmail"
                      className={styles.fieldLabel}
                    >
                      Gmail Address
                    </label>
                    <input
                      id="direct-gmail"
                      name="direct_gmail"
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      className={styles.input}
                    />
                  </div>
                  <button
                    type="submit"
                    className={styles.outlineBtn}
                  >
                    <span>Continue to Set Password &rarr;</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Create Password for the verified Google Account */
              <form onSubmit={handleCompleteGoogleSignup} className={styles.form}>
                <div className={styles.verifiedCard}>
                  {googleProfile.picture ? (
                    <img
                      src={googleProfile.picture}
                      alt={googleProfile.name || googleProfile.email}
                      className={styles.avatarImg}
                    />
                  ) : (
                    <div className={styles.avatarFallback}>
                      {googleProfile.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.verifiedTextGroup}>
                    <div className={styles.verifiedBadge}>
                      <FiCheckCircle />
                      <span>Verified Google Account</span>
                    </div>
                    <div className={styles.verifiedEmail}>
                      {googleProfile.email}
                    </div>
                    {googleProfile.name && (
                      <div className={styles.verifiedName}>{googleProfile.name}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleProfile(null);
                      setSignupPassword('');
                      setSignupConfirmPassword('');
                    }}
                    className={styles.ghostBtn}
                  >
                    Change
                  </button>
                </div>
                <div className={styles.field}>
                  <label
                    htmlFor="signup-password"
                    className={styles.fieldLabel}
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
                    className={styles.input}
                  />
                </div>
                <div className={styles.field}>
                  <label
                    htmlFor="signup-confirm-password"
                    className={styles.fieldLabel}
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
                    className={styles.input}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className={styles.primaryBtn}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Completing Registration...</span>
                    </>
                  ) : (
                    <span>Register &amp; Unlock Free Access &rarr;</span>
                  )}
                </button>
              </form>
            )}
            <div className={styles.footerLinkText}>
              <span>Already have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                }}
                className={styles.linkBtn}
              >
                Sign In with Password &rarr;
              </button>
            </div>
          </div>
        )}
        <div className={styles.footerNote}>
          <p>Institutional-grade financial precision. Fast, private, and free.</p>
        </div>
      </div>
    </div>
  );
};
export default Login;
