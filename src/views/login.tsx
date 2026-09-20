'use client';
import React from 'react';
import { useNavigate } from '@/navigation';
import SEOHead from '../components/SEOHead';
import { useLoginState } from './login/useLoginState';
import { LoginHeader } from './login/LoginHeader';
import { SignInForm } from './login/SignInForm';
import { GoogleSignUpStepOne } from './login/GoogleSignUpStepOne';
import { GoogleSignUpStepTwo } from './login/GoogleSignUpStepTwo';
import styles from './Login.module.scss';
const Login = () => {
  const navigate = useNavigate();
  const {
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
  } = useLoginState();
  return (
    <div className={styles.pageWrapper}>
      <SEOHead
        title="Sign In | Rupee Calculator"
        description="Sign in to your Rupee Calculator account to manage your pro subscription, saved mutual fund portfolios, and economic models."
        canonicalPath="/login"
        noIndex={true}
      />
      <div className={styles.card}>
        <LoginHeader
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setError(null);
          }}
        />
        {error && (
          <div className={styles.errorAlert}>
            <span>{error}</span>
          </div>
        )}
        {activeTab === 'signin' ? (
          <SignInForm
            loginEmail={loginEmail}
            setLoginEmail={setLoginEmail}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            isSubmitting={isSubmitting}
            loading={loading}
            onSubmit={handleLogin}
            onSwitchToSignup={() => {
              setActiveTab('signup');
              setError(null);
            }}
          />
        ) : (
          <div className={styles.form}>
            {!googleProfile ? (
              <GoogleSignUpStepOne
                onProfileSelect={(p) => {
                  setGoogleProfile(p);
                  setError(null);
                }}
                onSuccess={() => navigate(getTargetRoute(), { replace: true })}
                onError={setError}
              />
            ) : (
              <GoogleSignUpStepTwo
                googleProfile={googleProfile}
                onChangeProfile={() => {
                  setGoogleProfile(null);
                  setSignupPassword('');
                  setSignupConfirmPassword('');
                }}
                signupPassword={signupPassword}
                setSignupPassword={setSignupPassword}
                signupConfirmPassword={signupConfirmPassword}
                setSignupConfirmPassword={setSignupConfirmPassword}
                isSubmitting={isSubmitting}
                loading={loading}
                onSubmit={handleCompleteGoogleSignup}
              />
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
