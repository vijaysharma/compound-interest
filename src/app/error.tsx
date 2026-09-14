'use client';
import { useEffect } from 'react';
import Link from '@/navigation';
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled runtime error captured in error boundary:', error);
  }, [error]);
  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
          textAlign: 'center',
        }}
      >
        {/* Brand Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.25)',
          }}
        >
          <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 800 }}>₹</span>
        </div>
        {/* Error Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
            }}
          />
          Application Error
        </div>
        {/* Heading */}
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary, #0f172a)',
            margin: '0 0 12px',
            lineHeight: 1.25,
          }}
        >
          Something Went Wrong
        </h1>
        {/* Message */}
        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--text-muted, #64748b)',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          We encountered an unexpected issue while processing your calculation. Your data is safe.
          Please try refreshing the section or return to the calculator suite.
        </p>
        {/* Digest / Debug if present */}
        {error.digest && (
          <div
            style={{
              backgroundColor: 'var(--bg-hover, #f8fafc)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.75rem',
              color: '#64748b',
              fontFamily: 'monospace',
              marginBottom: '24px',
            }}
          >
            Error Reference ID: {error.digest}
          </div>
        )}
        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '28px',
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 22px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              transition: 'background-color 0.15s ease',
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-primary, #0f172a)',
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Return to Home
          </Link>
        </div>
        {/* Quick Nav Section */}
        <div
          style={{
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            paddingTop: '20px',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-muted, #64748b)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            Popular Calculators
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '8px',
            }}
          >
            <Link
              href="/mutual-funds/lumpsum"
              style={{
                fontSize: '0.825rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              • Mutual Fund Lumpsum
            </Link>
            <Link
              href="/sip-calculator"
              style={{
                fontSize: '0.825rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              • SIP Calculator
            </Link>
            <Link
              href="/emi-calculator"
              style={{
                fontSize: '0.825rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              • EMI Calculator
            </Link>
            <Link
              href="/income-tax-calculator"
              style={{
                fontSize: '0.825rem',
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              • Income Tax Calculator
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
