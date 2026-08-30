import { useEffect, useRef, useState } from 'react';
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
          prompt: () => void;
        };
      };
    };
  }
}
interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  className?: string;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}
const GoogleSignInButton = ({
  onSuccess,
  className = '',
  text = 'continue_with',
}: GoogleSignInButtonProps) => {
  const { loginWithGoogle, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSdkLoaded, setIsSdkLoaded] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.google || document.getElementById('google-gsi-script'));
  });
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  useEffect(() => {
    if (!clientId || isSdkLoaded) return;
    const existingScript = document.getElementById('google-gsi-script');
    if (existingScript) {
      if (!window.google) {
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
    document.body.appendChild(script);
  }, [clientId, isSdkLoaded]);
  useEffect(() => {
    if (!isSdkLoaded || !clientId || !buttonRef.current || !window.google) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (response.credential) {
            try {
              setError(null);
              await loginWithGoogle(response.credential);
              if (onSuccess) onSuccess();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Sign in failed');
            }
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
      console.warn('Google GSI initialization error:', err);
    }
  }, [isSdkLoaded, clientId, loginWithGoogle, onSuccess, text]);
  const handleDevSignIn = async () => {
    const email = window.prompt(
      'Enter your Google account email for sign-in:',
      import.meta.env.VITE_ALLOWED_EMAIL || 'user@example.com'
    );
    if (!email) return;
    try {
      setError(null);
      // Create dev mock token format
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          email: email.trim(),
          name: email.split('@')[0],
          picture: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`,
          sub: `google-${Date.now()}`,
          email_verified: true,
        })
      );
      const devJwt = `${header}.${payload}.mockSignature`;
      await loginWithGoogle(devJwt);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {clientId ? (
        <div ref={buttonRef} className="min-h-[44px]" />
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleDevSignIn()}
          className="btn btn-outline border-base-300 hover:border-primary flex w-full max-w-xs items-center justify-center gap-3 bg-base-100 px-4 py-2 font-medium shadow-sm transition-all"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
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
          <span>Continue with Google</span>
        </button>
      )}
      {error && <p className="text-xs text-error text-center">{error}</p>}
    </div>
  );
};
export default GoogleSignInButton;
