import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
  FiCheck,
  FiClock,
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiRotateCcw,
  FiSliders,
  FiSmartphone,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../context/useAuth';
import { PaymentSettings, PaymentSubmission } from '../types/auth';
import styles from './Admin.module.scss';
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  free_limit: number;
  subscription_status: string;
  subscription_expires_at: string | null;
  first_used_at: string | null;
  trial_expires_at: string | null;
  created_at: string;
}
const Admin = () => {
  const { token: authToken, user } = useAuth();
  const [token, setToken] = useState(() => authToken || '');
  const [activeTab, setActiveTab] = useState<'payments' | 'submissions' | 'users' | 'sync'>(
    'payments'
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Payment settings state
  const [payTitle, setPayTitle] = useState('Rupee Calculator Pro Subscription');
  const [payUpiId, setPayUpiId] = useState('');
  const [payQrUrl, setPayQrUrl] = useState('');
  const [payAmount, setPayAmount] = useState(54);
  const [payInstructions, setPayInstructions] = useState(
    'Pay ₹54 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.'
  );
  // Submissions state
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  // Users state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [limitModalUser, setLimitModalUser] = useState<AdminUser | null>(null);
  const [customLimitInput, setCustomLimitInput] = useState<number>(15);
  const [now] = useState(() => Date.now());
  // Sync state
  const [imfJson, setImfJson] = useState('');
  const [pppJson, setPppJson] = useState('');
  const effectiveToken = token || authToken || '';
  const fetchSubmissions = async () => {
    if (!effectiveToken) return;
    try {
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { submissions: PaymentSubmission[] };
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.warn('Failed to fetch payment submissions:', err);
    }
  };
  const fetchUsers = async () => {
    if (!effectiveToken) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${effectiveToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { users: AdminUser[] };
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.warn('Failed to fetch users:', err);
    }
  };
  useEffect(() => {
    let cancelled = false;
    const loadInitialData = async () => {
      try {
        const res = await fetch('/api/payments/settings');
        if (res.ok && !cancelled) {
          const data = (await res.json()) as { settings: PaymentSettings };
          setPayTitle(data.settings.title || '');
          setPayUpiId(data.settings.upi_id || '');
          setPayQrUrl(data.settings.upi_qr_code_url || '');
          setPayAmount(data.settings.amount || 54);
          setPayInstructions(data.settings.instructions || '');
        }
      } catch (err) {
        console.warn('Failed to load payment settings:', err);
      }
      if (effectiveToken && !cancelled) {
        try {
          const subRes = await fetch('/api/admin/payments', {
            headers: { Authorization: `Bearer ${effectiveToken}` },
          });
          if (subRes.ok && !cancelled) {
            const data = (await subRes.json()) as { submissions: PaymentSubmission[] };
            setSubmissions(data.submissions || []);
          }
        } catch (err) {
          console.warn('Failed to fetch payment submissions:', err);
        }
        try {
          const userRes = await fetch('/api/admin/users', {
            headers: { Authorization: `Bearer ${effectiveToken}` },
          });
          if (userRes.ok && !cancelled) {
            const data = (await userRes.json()) as { users: AdminUser[] };
            setUsersList(data.users || []);
          }
        } catch (err) {
          console.warn('Failed to fetch users:', err);
        }
      }
    };
    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, [effectiveToken]);
  const handleSavePaymentSettings = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('saving_settings');
    setMessage(null);
    try {
      const res = await fetch('/api/payments/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({
          title: payTitle,
          upi_id: payUpiId.trim(),
          upi_qr_code_url: payQrUrl.trim(),
          amount: Number(payAmount),
          instructions: payInstructions,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');
      setMessage({ type: 'success', text: 'UPI payment settings & QR code updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Save failed' });
    } finally {
      setBusy(null);
    }
  };
  const handleQrFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WebP, etc.)');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Image file size must be less than 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result && result.startsWith('data:image/')) {
        setPayQrUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };
  const handleProcessPayment = async (submissionId: string, action: 'approve' | 'reject') => {
    setBusy(`sub_${submissionId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ submission_id: submissionId, action }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage({ type: 'success', text: data.message || `Payment ${action}d.` });
      void fetchSubmissions();
      void fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(null);
    }
  };
  const handleUserAction = async (
    userId: string,
    action: 'grant_access' | 'reset_usage' | 'reset_trial' | 'set_limit' | 'extend_trial_time',
    extra?: { free_limit?: number; hours?: number }
  ) => {
    setBusy(`user_${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ user_id: userId, action, ...extra }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage({ type: 'success', text: data.message || 'User updated.' });
      void fetchUsers();
      setLimitModalUser(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(null);
    }
  };
  const sync = async (endpoint: string, body?: string) => {
    setBusy(endpoint);
    setMessage(null);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body,
      });
      const result = (await response.json()) as { error?: string; synced?: number | boolean };
      if (!response.ok) throw new Error(result.error ?? 'Sync failed');
      let successText = 'Dataset synced successfully.';
      if (endpoint.includes('sync-mutual-funds')) {
        successText = `Mutual funds synced: ${result.synced}.`;
      } else if (endpoint.includes('sync-imf')) {
        successText = 'IMF inflation data synced successfully.';
      } else if (endpoint.includes('sync-ppp')) {
        successText =
          typeof result.synced === 'number'
            ? `World Bank PPP synced: ${result.synced} records.`
            : 'World Bank PPP data synced successfully.';
      }
      setMessage({
        type: 'success',
        text: successText,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Sync failed' });
    } finally {
      setBusy(null);
    }
  };
  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Portal &amp; Management</h1>
          <p className={styles.subtitle}>
            Configure UPI QR payments, approve subscriptions, manage user quotas, and sync datasets.
          </p>
        </div>
        {user && (
          <div className={styles.adminBadge}>
            Admin: {user.email}
          </div>
        )}
      </div>
      {/* Admin Tabs */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'payments' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <FiSmartphone size={16} />
          <span>UPI &amp; QR Settings</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'submissions' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('submissions');
            void fetchSubmissions();
          }}
        >
          <FiCreditCard size={16} />
          <span>
            Payment Submissions ({submissions.filter((s) => s.status === 'pending').length})
          </span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('users');
            void fetchUsers();
          }}
        >
          <FiUsers size={16} />
          <span>Users &amp; Quotas ({usersList.length})</span>
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'sync' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          <FiRefreshCw size={16} />
          <span>Dataset Sync</span>
        </button>
      </div>
      {message && (
        <div
          className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}
        >
          <span>{message.text}</span>
        </div>
      )}
      {/* Tab 1: UPI & QR Settings */}
      {activeTab === 'payments' && (
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>UPI Payment &amp; QR Code Configuration</h2>
          <p className={styles.sectionDesc}>
            Customize the ₹54 paywall payment details, UPI ID, QR code image, and instructions shown
            to users.
          </p>
          <form onSubmit={handleSavePaymentSettings}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>
                  Payment Title
                </label>
                <input
                  type="text"
                  required
                  value={payTitle}
                  onChange={(e) => setPayTitle(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>
                  UPI ID / VPA
                </label>
                <input
                  type="text"
                  required
                  value={payUpiId}
                  onChange={(e) => setPayUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank or merchant@upi"
                  className={`${styles.input} ${styles.inputMono}`}
                />
              </div>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label}>
                  Subscription Fee (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className={styles.input}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.label}>
                  Upload QR Code Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className={styles.fileInput}
                />
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>
                QR Code Image URL or Base64 Data URL
              </label>
              <input
                type="text"
                value={payQrUrl}
                onChange={(e) => setPayQrUrl(e.target.value)}
                placeholder="https://example.com/upi-qr.png or data:image/png;base64,..."
                className={`${styles.input} ${styles.inputMono}`}
              />
            </div>
            {/* Live QR Preview */}
            {payQrUrl && (
              <div className={styles.qrPreview}>
                <span className={styles.qrPreviewTitle}>
                  Live QR Preview in User Paywall
                </span>
                <img
                  src={payQrUrl}
                  alt="QR Preview"
                  className={styles.qrImage}
                />
              </div>
            )}
            <div className={styles.formField}>
              <label className={styles.label}>
                Instructions Text for Users
              </label>
              <textarea
                rows={2}
                value={payInstructions}
                onChange={(e) => setPayInstructions(e.target.value)}
                className={styles.textarea}
              />
            </div>
            <button
              type="submit"
              disabled={busy === 'saving_settings'}
              className={styles.btnPrimary}
            >
              {busy === 'saving_settings' ? (
                <>
                  <span className={styles.spinner} />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <span>Save Payment Settings &amp; QR Code</span>
              )}
            </button>
          </form>
        </section>
      )}
      {/* Tab 2: Payment Submissions */}
      {activeTab === 'submissions' && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>UPI Payment Submissions</h2>
              <p className={styles.subtitle}>
                Review submitted UPI UTR numbers and approve 30-day Pro access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchSubmissions()}
              className={styles.btnOutline}
            >
              Refresh
            </button>
          </div>
          {submissions.length === 0 ? (
            <p className={styles.emptyPlaceholder}>
              No payment submissions recorded yet.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>UTR / Ref Number</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className={styles.tableRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: 600 }}>{sub.user_email}</td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                        {sub.utr_ref}
                      </td>
                      <td>₹{sub.amount}</td>
                      <td style={{ opacity: 0.7, fontSize: '11px' }}>
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            sub.status === 'approved'
                              ? styles.badgeSuccess
                              : sub.status === 'rejected'
                                ? styles.badgeError
                                : styles.badgeWarning
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className={styles.tableRight}>
                        {sub.status === 'pending' ? (
                          <div className={styles.actionsGroup}>
                            <button
                              type="button"
                              disabled={busy === `sub_${sub.id}`}
                              onClick={() => void handleProcessPayment(sub.id, 'approve')}
                              className={styles.btnSuccess}
                            >
                              <FiCheck />
                              <span>Approve (+30d)</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy === `sub_${sub.id}`}
                              onClick={() => void handleProcessPayment(sub.id, 'reject')}
                              className={`${styles.btnGhost} ${styles.btnDanger}`}
                            >
                              <FiX />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ opacity: 0.5, fontSize: '11px' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {/* Tab 3: Users & Quotas */}
      {activeTab === 'users' && (
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>User Management &amp; Quotas</h2>
              <p className={styles.subtitle}>
                Track user calculation usage, 48-hour first-usage trial windows, and grant access or
                quota overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className={styles.btnOutline}
            >
              <FiRefreshCw />
              <span>Refresh</span>
            </button>
          </div>
          {usersList.length === 0 ? (
            <p className={styles.emptyPlaceholder}>
              No registered users found.
            </p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Quota (MF &amp; PPP)</th>
                    <th>48h Trial (From 1st Use)</th>
                    <th>Subscription</th>
                    <th>Expires At</th>
                    <th className={styles.tableRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const limit = u.free_limit || 15;
                    const isOverLimit = u.api_usage_count >= limit;
                    let trialBadge = (
                      <span className={`${styles.badge} ${styles.badgeGhost}`}>Not Started</span>
                    );
                    if (u.trial_expires_at) {
                      const diff = new Date(u.trial_expires_at).getTime() - now;
                      if (diff <= 0) {
                        trialBadge = (
                          <span className={`${styles.badge} ${styles.badgeError}`}>Expired</span>
                        );
                      } else {
                        const hrs = Math.floor(diff / (1000 * 60 * 60));
                        trialBadge = (
                          <span className={`${styles.badge} ${styles.badgeInfo}`}>
                            Active ({hrs}h left)
                          </span>
                        );
                      }
                    }
                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.email}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAccent : styles.badgeGhost}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                color: isOverLimit && u.role !== 'admin' ? '#ef4444' : 'var(--color-primary)'
                              }}
                            >
                              {u.api_usage_count} / {limit}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLimitModalUser(u);
                                setCustomLimitInput(limit);
                              }}
                              className={`${styles.btnGhost} ${styles.btnIcon}`}
                              title="Edit calculation quota limit"
                            >
                              <FiEdit2 />
                            </button>
                          </div>
                        </td>
                        <td>{trialBadge}</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              u.subscription_status === 'active'
                                ? styles.badgeSuccess
                                : isOverLimit
                                  ? styles.badgeError
                                  : styles.badgeInfo
                            }`}
                          >
                            {u.subscription_status}
                          </span>
                        </td>
                        <td style={{ opacity: 0.7, fontSize: '11px' }}>
                          {u.subscription_expires_at
                            ? new Date(u.subscription_expires_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className={styles.tableRight}>
                          <div className={styles.actionsGroup}>
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() => void handleUserAction(u.id, 'reset_trial')}
                              className={`${styles.btnGhost} ${styles.btnWarning}`}
                              title="Reset trial to 0 runs and fresh 48h from next usage"
                            >
                              <FiRotateCcw />
                              <span>Reset Trial</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() =>
                                void handleUserAction(u.id, 'extend_trial_time', { hours: 48 })
                              }
                              className={styles.btnOutline}
                              title="Extend trial time by +48 hours"
                            >
                              <FiClock />
                              <span>+48h</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() => void handleUserAction(u.id, 'grant_access')}
                              className={styles.btnOutline}
                              title="Grant 30 Days Pro Access"
                            >
                              <FiPlus />
                              <span>+30d Pro</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {/* Tab 4: Dataset Sync */}
      {activeTab === 'sync' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <label className={styles.card} style={{ display: 'block', margin: 0 }}>
            <span className={styles.label}>Admin Auth Token Override</span>
            <input
              className={`${styles.input} ${styles.inputMono}`}
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ADMIN_SYNC_TOKEN (auto-filled if signed in as admin)"
            />
          </label>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Mutual Fund Schemes Sync</h2>
            <p className={styles.sectionDesc}>
              Fetch and cache the latest scheme list from mfapi.in.
            </p>
            <button
              className={styles.btnPrimarySm}
              type="button"
              disabled={busy !== null}
              onClick={() => void sync('/api/admin/sync-mutual-funds')}
            >
              {busy === '/api/admin/sync-mutual-funds' ? 'Syncing...' : 'Sync Mutual Funds'}
            </button>
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>IMF Inflation Data Sync</h2>
            <p className={styles.sectionDesc}>
              Paste the JSON response from the IMF DataMapper API.
            </p>
            <textarea
              className={styles.textarea}
              style={{ minHeight: '180px', fontFamily: 'monospace', marginBottom: '1rem' }}
              value={imfJson}
              onChange={(event) => setImfJson(event.target.value)}
              placeholder='{"values":{"PCPIPCH":{...}}}'
            />
            <button
              className={styles.btnPrimarySm}
              type="button"
              disabled={!imfJson.trim() || busy !== null}
              onClick={() => {
                try {
                  const parsed = JSON.parse(imfJson);
                  void sync('/api/admin/sync-imf', JSON.stringify(parsed));
                } catch {
                  setMessage({ type: 'error', text: 'Paste valid JSON before syncing IMF data.' });
                }
              }}
            >
              {busy === '/api/admin/sync-imf' ? 'Syncing...' : 'Sync IMF JSON'}
            </button>
          </section>
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>
              World Bank PPP (Purchasing Power Parity) Sync
            </h2>
            <p className={styles.sectionDesc}>
              Fetch and store global Purchasing Power Parity (PA.NUS.PPP) conversion factor datasets
              from the World Bank API directly into our database.
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <button
                className={styles.btnPrimarySm}
                type="button"
                disabled={busy !== null}
                onClick={() => void sync('/api/admin/sync-ppp')}
              >
                {busy === '/api/admin/sync-ppp'
                  ? 'Fetching & Syncing from World Bank...'
                  : 'Sync from World Bank API'}
              </button>
            </div>
            <details className={styles.detailsCollapse}>
              <summary>
                Or Paste World Bank PPP JSON Manually
              </summary>
              <div className={styles.detailsContent}>
                <p style={{ opacity: 0.7, margin: 0 }}>
                  Paste the JSON response array from
                  api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP.
                </p>
                <textarea
                  className={styles.textarea}
                  style={{ minHeight: '140px', fontFamily: 'monospace' }}
                  value={pppJson}
                  onChange={(event) => setPppJson(event.target.value)}
                  placeholder='[{"page":1,...},[{"indicator":{...},"country":{...},"date":"2024","value":23.85},...]]'
                />
                <div>
                  <button
                    className={styles.btnSecondarySm}
                    type="button"
                    disabled={!pppJson.trim() || busy !== null}
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(pppJson);
                        void sync('/api/admin/sync-ppp', JSON.stringify(parsed));
                      } catch {
                        setMessage({
                          type: 'error',
                          text: 'Paste valid JSON before syncing PPP data.',
                        });
                      }
                    }}
                  >
                    {busy === '/api/admin/sync-ppp' ? 'Syncing...' : 'Sync Pasted PPP JSON'}
                  </button>
                </div>
              </div>
            </details>
          </section>
        </div>
      )}
      {/* Limit Modal */}
      {limitModalUser && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setLimitModalUser(null)}
            >
              <FiX size={16} />
            </button>
            <div className={styles.modalHeader}>
              <FiSliders className={styles.modalIcon} />
              <h3>Adjust Calculation Quota</h3>
            </div>
            <p className={styles.subtitle} style={{ marginBottom: '1rem' }}>
              Set the maximum allowed free live calculation runs for{' '}
              <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{limitModalUser.email}</span> (currently{' '}
              {limitModalUser.api_usage_count} used).
            </p>
            <div style={{ marginBottom: '1rem' }}>
              <label className={styles.label}>Quota Limit (Runs)</label>
              <input
                type="number"
                min="1"
                max="99999"
                value={customLimitInput}
                onChange={(e) => setCustomLimitInput(Number(e.target.value))}
                className={`${styles.input} ${styles.inputMono}`}
              />
              <div className={styles.presetGrid}>
                {[15, 25, 50, 100, 250, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomLimitInput(preset)}
                    className={`${styles.presetBtn} ${customLimitInput === preset ? styles.presetActive : ''}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setLimitModalUser(null)}
                className={styles.btnOutline}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy === `user_${limitModalUser.id}`}
                onClick={() =>
                  void handleUserAction(limitModalUser.id, 'set_limit', {
                    free_limit: customLimitInput,
                  })
                }
                className={styles.btnPrimarySm}
              >
                {busy === `user_${limitModalUser.id}` ? 'Saving...' : 'Save Quota'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
export default Admin;
