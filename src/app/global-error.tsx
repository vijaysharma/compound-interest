'use client';
import { useEffect } from 'react';
interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Critical root error captured in global error boundary:', error);
  }, [error]);
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '36px 32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}
        >
          {/* Brand Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6d0b74 0%, #9c27b0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 15px -3px rgba(109, 11, 116, 0.25)',
            }}
          >
            <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800 }}>₹</span>
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#212121',
              margin: '0 0 12px',
            }}
          >
            Application Error
          </h1>
          <p
            style={{
              fontSize: '0.925rem',
              color: '#757575',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}
          >
            An unexpected error interrupted the page layout. Please click below to reload the application.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                backgroundColor: '#6d0b74',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(109, 11, 116, 0.2)',
              }}
            >
              Reload Page
            </button>
            <a
              href="/"
              style={{
                backgroundColor: 'transparent',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
