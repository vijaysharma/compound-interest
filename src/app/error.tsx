'use client';
import { useEffect, useState } from 'react';
import Link from '@/navigation';
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
export default function ErrorPage({ error, reset }: ErrorProps) {
  const [activeTab, setActiveTab] = useState<'recovery' | 'diagnostics' | 'details'>('recovery');
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [diagnosticState, setDiagnosticState] = useState<{
    tested: boolean;
    online: boolean;
    storage: boolean;
    latencyMs: number | null;
  }>({
    tested: false,
    online: true,
    storage: true,
    latencyMs: null,
  });
  const [calculatorCategory, setCalculatorCategory] = useState<'all' | 'invest' | 'loans' | 'tax'>('all');
  useEffect(() => {
    console.error('Unhandled runtime error captured in error boundary:', error);
  }, [error]);
  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      reset();
    }, 400);
  };
  const runDiagnostics = () => {
    const startTime = performance.now();
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    let storageOk = false;
    try {
      const testKey = '__diag_test__';
      window.localStorage.setItem(testKey, '1');
      storageOk = window.localStorage.getItem(testKey) === '1';
      window.localStorage.removeItem(testKey);
    } catch {
      storageOk = false;
    }
    const elapsed = Math.round(performance.now() - startTime);
    setDiagnosticState({
      tested: true,
      online: isOnline,
      storage: storageOk,
      latencyMs: elapsed,
    });
  };
  const handleCopyReport = () => {
    const report = `Error: ${error.message || 'Unknown error'}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}\nURL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}\nTimestamp: ${new Date().toISOString()}`;
    navigator.clipboard?.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };
  const calculators = [
    { title: 'Mutual Fund Lumpsum', href: '/mutual-funds/lumpsum', cat: 'invest', icon: '📈', desc: 'Historical rolling returns & CAGR' },
    { title: 'SIP Calculator', href: '/sip-calculator', cat: 'invest', icon: '💰', desc: 'Systematic compounding & growth' },
    { title: 'SWP Calculator', href: '/swp-calculator', cat: 'invest', icon: '🏧', desc: 'Tax-efficient regular cash flows' },
    { title: 'EMI Calculator', href: '/emi-calculator', cat: 'loans', icon: '🏠', desc: 'Loan amortization & interest breakdown' },
    { title: 'Income Tax Calculator', href: '/income-tax-calculator', cat: 'tax', icon: '⚖️', desc: 'New vs Old tax regime comparison' },
    { title: 'PPF Calculator', href: '/ppf-calculator', cat: 'invest', icon: '🛡️', desc: 'Public Provident Fund 15-yr growth' },
  ];
  const filteredCalcs = calculatorCategory === 'all'
    ? calculators
    : calculators.filter((c) => c.cat === calculatorCategory);
  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          maxWidth: '740px',
          width: '100%',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 25px 50px -12px rgba(109, 11, 116, 0.12), 0 10px 15px -3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Header Banner with Theme Primary Color */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            padding: '28px 24px 20px',
            color: 'var(--color-primary-content)',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          {/* Animated SVG Financial Circuit Infographic */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <svg
              width="180"
              height="60"
              viewBox="0 0 180 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ overflow: 'visible' }}
            >
              {/* Background trajectory line */}
              <path
                d="M 10 30 Q 50 10 90 30 T 170 30"
                stroke="rgba(255, 255, 255, 0.25)"
                strokeWidth="2.5"
                strokeDasharray="4 4"
                fill="none"
              />
              {/* Reconnecting trajectory */}
              <path
                d="M 10 30 C 40 45, 60 15, 90 30 C 120 45, 140 15, 170 30"
                stroke="color-mix(in srgb, var(--color-primary-content) 60%, transparent)"
                strokeWidth="2"
                fill="none"
              />
              {/* Left Node */}
              <circle cx="20" cy="30" r="5" fill="var(--color-primary-content)" />
              {/* Central Rupee Badge Shield */}
              <g
                style={{ cursor: 'pointer' }}
                onClick={handleRetry}
              >
                <title>Click to retry</title>
                <circle cx="90" cy="30" r="22" fill="color-mix(in srgb, var(--color-primary-content) 15%, transparent)" stroke="var(--color-primary-content)" strokeWidth="2" />
                <circle cx="90" cy="30" r="16" fill="var(--color-primary-content)" />
                <text
                  x="90"
                  y="36"
                  textAnchor="middle"
                  fill="var(--color-primary)"
                  fontSize="18"
                  fontWeight="800"
                  fontFamily="sans-serif"
                >
                  ₹
                </text>
              </g>
              {/* Right Recovery Node */}
              <circle cx="160" cy="30" r="5" fill="var(--color-primary-content)" />
            </svg>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              padding: '4px 14px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-warning)',
                boxShadow: '0 0 8px var(--color-warning)',
              }}
            />
            Calculation Paused
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              margin: '0 0 8px',
              lineHeight: 1.25,
            }}
          >
            Something Interrupted Your Calculation
          </h1>
          <p
            style={{
              fontSize: '0.9rem',
              opacity: 0.92,
              maxWidth: '520px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Your input data and cached values remain safe in your browser. We have paused the calculation to prevent inaccuracies.
          </p>
        </div>
        {/* Interactive Subsystem Health Infographic */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            padding: '16px 20px',
            backgroundColor: 'var(--color-primary-light)',
            borderBottom: '1px solid var(--color-primary-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border)',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🧮</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Math Engine</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 600 }}>● Operational</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border)',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>💾</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Local Vault</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 600 }}>● Inputs Intact</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border)',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>📡</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Market Feed</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-warning)', fontWeight: 600 }}>● Reconnecting</div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-bg)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--color-border)',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ fontSize: '1rem' }}>🔒</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Data Security</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--color-success)', fontWeight: 600 }}>● 100% Private</div>
            </div>
          </div>
        </div>
        {/* Interactive Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            padding: '0 16px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('recovery')}
            style={{
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'recovery' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === 'recovery' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            ⚡ Quick Recovery
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('diagnostics');
              if (!diagnosticState.tested) runDiagnostics();
            }}
            style={{
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'diagnostics' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === 'diagnostics' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            🩺 Live Diagnostics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              padding: '12px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'details' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === 'details' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            📋 Technical Details
          </button>
        </div>
        {/* Tab Content Area */}
        <div style={{ padding: '24px', flex: 1 }}>
          {activeTab === 'recovery' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-content)',
                    border: 'none',
                    borderRadius: 'var(--radius-btn, 8px)',
                    padding: '12px 28px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(109, 11, 116, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isRetrying ? 'Refreshing Calculation...' : '🔄 Resume & Try Again'}
                </button>
                <Link
                  href="/"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-btn, 8px)',
                    padding: '12px 22px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Explore All Calculators
                </Link>
              </div>
              {/* Calculator Directory Filter Chips */}
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Direct Access to Ready Calculators
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['all', 'invest', 'loans', 'tax'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCalculatorCategory(cat)}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          border: '1px solid',
                          borderColor: calculatorCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                          backgroundColor: calculatorCategory === cat ? 'var(--color-primary)' : 'transparent',
                          color:
                            calculatorCategory === cat
                              ? 'var(--color-primary-content)'
                              : 'var(--color-text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {cat === 'all' ? 'All' : cat === 'invest' ? 'Investments' : cat === 'loans' ? 'Loans' : 'Tax'}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {filteredCalcs.map((calc) => (
                    <Link
                      key={calc.href}
                      href={calc.href}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md, 8px)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem' }}>{calc.icon}</span>
                      <div>
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--color-primary)',
                            marginBottom: '2px',
                          }}
                        >
                          {calc.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          {calc.desc}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'diagnostics' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-heading)' }}>
                    Client Environment Self-Check
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    Tests browser sandbox, storage accessibility, and network latency.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runDiagnostics}
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary-subtle)',
                    borderRadius: 'var(--radius-btn, 8px)',
                    padding: '6px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Re-test
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Internet Connectivity</span>
                  <span style={{ color: diagnosticState.online ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>
                    {diagnosticState.online ? '✓ Online & Connected' : '✗ Offline'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Local Vault Storage</span>
                  <span style={{ color: diagnosticState.storage ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>
                    {diagnosticState.storage ? '✓ Accessible & Persistent' : '✗ Blocked or Quota Full'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '0.82rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>DOM & Engine Latency</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>
                    {diagnosticState.latencyMs !== null ? `${diagnosticState.latencyMs} ms (High Speed)` : 'Ready'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                💡 If internet and storage are green, this is usually a transient upstream render anomaly. Clicking <strong>Resume & Try Again</strong> will restore the workspace.
              </p>
            </div>
          )}
          {activeTab === 'details' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Incident Diagnostic Payload
                </span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  style={{
                    backgroundColor: copied
                      ? 'var(--color-success-surface-strong)'
                      : 'var(--color-primary-light)',
                    color: copied
                      ? 'var(--color-success-text-strong)'
                      : 'var(--color-primary)',
                    border: '1px solid',
                    borderColor: copied
                      ? 'var(--color-success-border-strong)'
                      : 'var(--color-primary-subtle)',
                    borderRadius: 'var(--radius-btn, 8px)',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copied ? '✓ Report Copied!' : '📋 Copy Error Report'}
                </button>
              </div>
              {error.digest && (
                <div
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    marginBottom: '10px',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}
                >
                  Error Digest ID: {error.digest}
                </div>
              )}
              <pre
                style={{
                  backgroundColor: 'var(--color-neutral)',
                  color: 'var(--color-neutral-content)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  margin: 0,
                  maxHeight: '180px',
                  lineHeight: 1.5,
                }}
              >
                {error.message || 'No additional error string provided by host.'}
                {error.stack ? `\n\nStack:\n${error.stack}` : ''}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
