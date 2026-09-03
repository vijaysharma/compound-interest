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
import ShiprocketRates from '../components/admin/ShiprocketRates';
import VolumetricWeight from '../components/admin/VolumetricWeight';
import WoodCalculator from '../components/admin/WoodCalculator';
import QuickNotes from '../components/admin/QuickNotes';
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
  const [activeTab, setActiveTab] = useState<
    'payments' | 'submissions' | 'users' | 'sync' | 'business_tools'
  >('payments');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Payment settings state
  const [payTitle, setPayTitle] = useState('Rupee Calculator Pro Subscription');
  const [payUpiId, setPayUpiId] = useState('');
  const [payQrUrl, setPayQrUrl] = useState('');
  const [payAmount, setPayAmount] = useState(29);
  const [payInstructions, setPayInstructions] = useState(
    'Pay ₹29 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.'
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
          setPayAmount(data.settings.amount || 29);
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
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
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
    <main className="mx-auto max-w-4xl p-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Portal &amp; Management</h1>
          <p className="text-xs sm:text-sm opacity-70">
            Configure UPI QR payments, approve subscriptions, manage user quotas, and sync datasets.
          </p>
        </div>
        {user && (
          <div className="badge badge-accent font-semibold text-xs py-2 px-3">
            Admin: {user.email}
          </div>
        )}
      </div>
      {/* Admin Tabs */}
      <div className="tabs tabs-boxed mb-6 p-1 bg-base-200 flex flex-wrap gap-1">
        <button
          type="button"
          className={`tab flex items-center gap-1.5 ${activeTab === 'payments' ? 'tab-active font-bold' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <FiSmartphone className="h-4 w-4" />
          <span>UPI &amp; QR Settings</span>
        </button>
        <button
          type="button"
          className={`tab flex items-center gap-1.5 ${activeTab === 'submissions' ? 'tab-active font-bold' : ''}`}
          onClick={() => {
            setActiveTab('submissions');
            void fetchSubmissions();
          }}
        >
          <FiCreditCard className="h-4 w-4" />
          <span>
            Payment Submissions ({submissions.filter((s) => s.status === 'pending').length})
          </span>
        </button>
        <button
          type="button"
          className={`tab flex items-center gap-1.5 ${activeTab === 'users' ? 'tab-active font-bold' : ''}`}
          onClick={() => {
            setActiveTab('users');
            void fetchUsers();
          }}
        >
          <FiUsers className="h-4 w-4" />
          <span>Users &amp; Quotas ({usersList.length})</span>
        </button>
        <button
          type="button"
          className={`tab flex items-center gap-1.5 ${activeTab === 'sync' ? 'tab-active font-bold' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          <FiRefreshCw className="h-4 w-4" />
          <span>Dataset Sync</span>
        </button>
        <button
          type="button"
          className={`tab flex items-center gap-1.5 ${activeTab === 'business_tools' ? 'tab-active font-bold' : ''}`}
          onClick={() => setActiveTab('business_tools')}
        >
          <FiSliders className="h-4 w-4" />
          <span>Business Tools</span>
        </button>
      </div>
      {message && (
        <div
          className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} text-xs py-3 px-4 mb-6 rounded-lg shadow-sm`}
        >
          <span>{message.text}</span>
        </div>
      )}
      {/* Tab 1: UPI & QR Settings */}
      {activeTab === 'payments' && (
        <section className="card bg-base-100 border border-base-300 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-1">UPI Payment &amp; QR Code Configuration</h2>
          <p className="text-xs opacity-70 mb-6">
            Customize the ₹29 paywall payment details, UPI ID, QR code image, and instructions shown
            to users.
          </p>
          <form onSubmit={handleSavePaymentSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1 opacity-80">
                  Payment Title
                </label>
                <input
                  type="text"
                  required
                  value={payTitle}
                  onChange={(e) => setPayTitle(e.target.value)}
                  className="input input-bordered input-primary w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1 opacity-80">
                  UPI ID / VPA
                </label>
                <input
                  type="text"
                  required
                  value={payUpiId}
                  onChange={(e) => setPayUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank or merchant@upi"
                  className="input input-bordered input-primary w-full text-sm font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1 opacity-80">
                  Subscription Fee (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="input input-bordered w-full text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase mb-1 opacity-80">
                  Upload QR Code Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrFileUpload}
                  className="file-input file-input-bordered file-input-primary w-full text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 opacity-80">
                QR Code Image URL or Base64 Data URL
              </label>
              <input
                type="text"
                value={payQrUrl}
                onChange={(e) => setPayQrUrl(e.target.value)}
                placeholder="https://example.com/upi-qr.png or data:image/png;base64,..."
                className="input input-bordered w-full text-xs font-mono"
              />
            </div>
            {/* Live QR Preview */}
            {payQrUrl && (
              <div className="p-4 bg-base-200 rounded-lg border border-base-300 text-center flex flex-col items-center">
                <span className="text-xs font-semibold uppercase opacity-60 mb-2">
                  Live QR Preview in User Paywall
                </span>
                <img
                  src={payQrUrl}
                  alt="QR Preview"
                  className="h-44 w-44 object-contain rounded bg-white p-2 border border-base-300 shadow-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 opacity-80">
                Instructions Text for Users
              </label>
              <textarea
                rows={2}
                value={payInstructions}
                onChange={(e) => setPayInstructions(e.target.value)}
                className="textarea textarea-bordered w-full text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={busy === 'saving_settings'}
              className="btn btn-primary font-semibold"
            >
              {busy === 'saving_settings' ? (
                <>
                  <span className="loading loading-spinner loading-xs" />
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
        <section className="card bg-base-100 border border-base-300 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">UPI Payment Submissions</h2>
              <p className="text-xs opacity-70">
                Review submitted UPI UTR numbers and approve 30-day Pro access.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchSubmissions()}
              className="btn btn-outline btn-xs"
            >
              Refresh
            </button>
          </div>
          {submissions.length === 0 ? (
            <p className="text-xs opacity-60 py-8 text-center bg-base-200/50 rounded-lg">
              No payment submissions recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-xs w-full">
                <thead>
                  <tr>
                    <th>User Email</th>
                    <th>UTR / Ref Number</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="font-semibold text-xs">{sub.user_email}</td>
                      <td className="font-mono text-primary text-xs select-all font-bold">
                        {sub.utr_ref}
                      </td>
                      <td className="text-xs">₹{sub.amount}</td>
                      <td className="text-[11px] opacity-70">
                        {new Date(sub.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge badge-xs text-[10px] font-bold uppercase ${
                            sub.status === 'approved'
                              ? 'badge-success'
                              : sub.status === 'rejected'
                                ? 'badge-error'
                                : 'badge-warning'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="text-right">
                        {sub.status === 'pending' ? (
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              disabled={busy === `sub_${sub.id}`}
                              onClick={() => void handleProcessPayment(sub.id, 'approve')}
                              className="btn btn-success btn-xs font-bold flex items-center gap-1"
                            >
                              <FiCheck className="h-3 w-3" />
                              <span>Approve (+30d)</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy === `sub_${sub.id}`}
                              onClick={() => void handleProcessPayment(sub.id, 'reject')}
                              className="btn btn-ghost btn-xs text-error flex items-center gap-1"
                            >
                              <FiX className="h-3 w-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] opacity-50">Processed</span>
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
        <section className="card bg-base-100 border border-base-300 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">User Management &amp; Quotas</h2>
              <p className="text-xs opacity-70">
                Track user calculation usage, 48-hour first-usage trial windows, and grant access or
                quota overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="btn btn-outline btn-xs flex items-center gap-1"
            >
              <FiRefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
          </div>
          {usersList.length === 0 ? (
            <p className="text-xs opacity-60 py-8 text-center bg-base-200/50 rounded-lg">
              No registered users found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-xs w-full">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Quota (MF &amp; PPP)</th>
                    <th>48h Trial (From 1st Use)</th>
                    <th>Subscription</th>
                    <th>Expires At</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const limit = u.free_limit || 15;
                    const isOverLimit = u.api_usage_count >= limit;
                    let trialBadge = (
                      <span className="badge badge-xs badge-ghost text-[10px]">Not Started</span>
                    );
                    if (u.trial_expires_at) {
                      const diff = new Date(u.trial_expires_at).getTime() - now;
                      if (diff <= 0) {
                        trialBadge = (
                          <span className="badge badge-xs badge-error text-[10px]">Expired</span>
                        );
                      } else {
                        const hrs = Math.floor(diff / (1000 * 60 * 60));
                        trialBadge = (
                          <span className="badge badge-xs badge-info text-[10px]">
                            Active ({hrs}h left)
                          </span>
                        );
                      }
                    }
                    return (
                      <tr key={u.id}>
                        <td className="font-semibold text-xs">{u.email}</td>
                        <td>
                          <span
                            className={`badge badge-xs font-bold uppercase text-[10px] ${u.role === 'admin' ? 'badge-accent' : 'badge-ghost'}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <div className="inline-flex items-center gap-1.5">
                            <span
                              className={`font-mono text-xs font-bold ${isOverLimit && u.role !== 'admin' ? 'text-error' : 'text-primary'}`}
                            >
                              {u.api_usage_count} / {limit}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setLimitModalUser(u);
                                setCustomLimitInput(limit);
                              }}
                              className="btn btn-ghost btn-xs p-1 h-auto text-primary hover:bg-primary/10"
                              title="Edit calculation quota limit"
                            >
                              <FiEdit2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td>{trialBadge}</td>
                        <td>
                          <span
                            className={`badge badge-xs font-bold text-[10px] uppercase ${
                              u.subscription_status === 'active'
                                ? 'badge-success'
                                : isOverLimit
                                  ? 'badge-error'
                                  : 'badge-info'
                            }`}
                          >
                            {u.subscription_status}
                          </span>
                        </td>
                        <td className="text-[11px] opacity-70">
                          {u.subscription_expires_at
                            ? new Date(u.subscription_expires_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="text-right">
                          <div className="inline-flex gap-1 flex-wrap justify-end">
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() => void handleUserAction(u.id, 'reset_trial')}
                              className="btn btn-ghost btn-xs text-xs flex items-center gap-1 text-warning hover:bg-warning/10"
                              title="Reset trial to 0 runs and fresh 48h from next usage"
                            >
                              <FiRotateCcw className="h-3 w-3" />
                              <span>Reset Trial</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() =>
                                void handleUserAction(u.id, 'extend_trial_time', { hours: 48 })
                              }
                              className="btn btn-outline btn-xs flex items-center gap-1"
                              title="Extend trial time by +48 hours"
                            >
                              <FiClock className="h-3 w-3" />
                              <span>+48h</span>
                            </button>
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() => void handleUserAction(u.id, 'grant_access')}
                              className="btn btn-outline btn-xs flex items-center gap-1"
                              title="Grant 30 Days Pro Access"
                            >
                              <FiPlus className="h-3 w-3" />
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
        <div className="space-y-6">
          <label className="block bg-base-100 p-4 rounded-lg border border-base-300">
            <span className="mb-1 block text-sm font-medium">Admin Auth Token Override</span>
            <input
              className="input input-bordered input-primary w-full text-sm font-mono"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="ADMIN_SYNC_TOKEN (auto-filled if signed in as admin)"
            />
          </label>
          <section className="card bg-base-100 border border-base-300 p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold">Mutual Fund Schemes Sync</h2>
            <p className="mb-4 text-xs opacity-70">
              Fetch and cache the latest scheme list from mfapi.in.
            </p>
            <button
              className="btn btn-primary btn-sm"
              type="button"
              disabled={busy !== null}
              onClick={() => void sync('/api/admin/sync-mutual-funds')}
            >
              {busy === '/api/admin/sync-mutual-funds' ? 'Syncing...' : 'Sync Mutual Funds'}
            </button>
          </section>
          <section className="card bg-base-100 border border-base-300 p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold">IMF Inflation Data Sync</h2>
            <p className="mb-2 text-xs opacity-70">
              Paste the JSON response from the IMF DataMapper API.
            </p>
            <textarea
              className="textarea textarea-bordered mb-4 h-48 w-full font-mono text-xs"
              value={imfJson}
              onChange={(event) => setImfJson(event.target.value)}
              placeholder='{"values":{"PCPIPCH":{...}}}'
            />
            <button
              className="btn btn-primary btn-sm"
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
          <section className="card bg-base-100 border border-base-300 p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold">
              World Bank PPP (Purchasing Power Parity) Sync
            </h2>
            <p className="mb-4 text-xs opacity-70">
              Fetch and store global Purchasing Power Parity (PA.NUS.PPP) conversion factor datasets
              from the World Bank API directly into our database.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                disabled={busy !== null}
                onClick={() => void sync('/api/admin/sync-ppp')}
              >
                {busy === '/api/admin/sync-ppp'
                  ? 'Fetching & Syncing from World Bank...'
                  : 'Sync from World Bank API'}
              </button>
            </div>
            <details className="collapse collapse-arrow bg-base-200 text-xs rounded-box border border-base-300">
              <summary className="collapse-title font-semibold py-2">
                Or Paste World Bank PPP JSON Manually
              </summary>
              <div className="collapse-content space-y-2 pt-2">
                <p className="opacity-70 text-xs">
                  Paste the JSON response array from
                  api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP.
                </p>
                <textarea
                  className="textarea textarea-bordered h-36 w-full font-mono text-xs"
                  value={pppJson}
                  onChange={(event) => setPppJson(event.target.value)}
                  placeholder='[{"page":1,...},[{"indicator":{...},"country":{...},"date":"2024","value":23.85},...]]'
                />
                <button
                  className="btn btn-secondary btn-sm"
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
            </details>
          </section>
        </div>
      )}
      {/* Tab 5: Business Tools */}
      {activeTab === 'business_tools' && (
        <div className="space-y-6">
          <ShiprocketRates token={effectiveToken} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WoodCalculator />
            <VolumetricWeight />
          </div>
          <QuickNotes token={effectiveToken} />
        </div>
      )}
      {/* Limit Modal */}
      {limitModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="card bg-base-100 border border-base-300 w-full max-w-sm p-6 shadow-2xl relative">
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square absolute right-3 top-3 opacity-70 hover:opacity-100"
              onClick={() => setLimitModalUser(null)}
            >
              <FiX className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <FiSliders className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base">Adjust Calculation Quota</h3>
            </div>
            <p className="text-xs opacity-75 mb-4">
              Set the maximum allowed free live calculation runs for{' '}
              <span className="font-semibold text-primary">{limitModalUser.email}</span> (currently{' '}
              {limitModalUser.api_usage_count} used).
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1">Quota Limit (Runs)</label>
              <input
                type="number"
                min="1"
                max="99999"
                value={customLimitInput}
                onChange={(e) => setCustomLimitInput(Number(e.target.value))}
                className="input input-bordered input-primary w-full text-sm font-mono"
              />
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {[15, 25, 50, 100, 250, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomLimitInput(preset)}
                    className={`btn btn-xs ${customLimitInput === preset ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLimitModalUser(null)}
                className="btn btn-ghost btn-xs"
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
                className="btn btn-primary btn-xs font-bold"
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
