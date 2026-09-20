'use client';
import { useEffect, useRef, useState } from 'react';
import type { GoogleProfile } from './types';
interface UseGoogleGsiOptions {
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  onProfileSelect?: (profile: GoogleProfile) => void;
  onCredentialReceived: (profile: { email: string; name: string }) => void;
}
export function useGoogleGsi({
  text = 'continue_with',
  onProfileSelect,
  onCredentialReceived,
}: UseGoogleGsiOptions) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const rawClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_VITE_GOOGLE_CLIENT_ID ||
    '';
  const hasValidClientId =
    typeof rawClientId === 'string' &&
    rawClientId.trim().length > 10 &&
    rawClientId.includes('.apps.googleusercontent.com');
  const [isSdkLoaded, setIsSdkLoaded] = useState(() => {
    return (
      typeof window !== 'undefined' &&
      Boolean(window.google?.accounts?.id && document.getElementById('google-gsi-script'))
    );
  });
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
    if (!isSdkLoaded || !hasValidClientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }
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
            onCredentialReceived({ email: emailFound, name: nameFound });
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
  }, [isSdkLoaded, hasValidClientId, rawClientId, onProfileSelect, onCredentialReceived, text]);
  return {
    buttonRef,
    hasValidClientId,
  };
}
