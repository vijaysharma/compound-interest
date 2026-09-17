import Link from '@/navigation';
export default function NotFound() {
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
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
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
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 15px -3px rgba(109, 11, 116, 0.25)',
          }}
        >
          <span style={{ color: 'var(--color-primary-content)', fontSize: '28px', fontWeight: 800 }}>₹</span>
        </div>
        {/* 404 Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            marginBottom: '16px',
          }}
        >
          404 Not Found
        </div>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            margin: '0 0 12px',
            lineHeight: 1.25,
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: '0.925rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            margin: '0 0 24px',
          }}
        >
          The page or calculator you are looking for might have been moved, renamed, or is temporarily unavailable.
        </p>
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
          <Link
            href="/"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-content)',
              border: 'none',
              borderRadius: 'var(--radius-btn, 8px)',
              padding: '10px 22px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 4px 6px -1px rgba(109, 11, 116, 0.25)',
            }}
          >
            Return to Home
          </Link>
        </div>
        {/* Quick Nav */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '20px',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            Explore Financial Calculators
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
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              • Mutual Fund Lumpsum
            </Link>
            <Link
              href="/sip-calculator"
              style={{
                fontSize: '0.825rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              • SIP Calculator
            </Link>
            <Link
              href="/emi-calculator"
              style={{
                fontSize: '0.825rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              • EMI Calculator
            </Link>
            <Link
              href="/income-tax-calculator"
              style={{
                fontSize: '0.825rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600,
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
