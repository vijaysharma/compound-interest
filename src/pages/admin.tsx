import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import { PaymentSettings, PaymentSubmission } from '../types/auth';
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  api_usage_count: number;
  subscription_status: string;
  subscription_expires_at: string | null;
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
  const [payAmount, setPayAmount] = useState(19);
  const [payInstructions, setPayInstructions] = useState(
    'Pay ₹19 for 1 Month Unlimited Access. Scan the QR code or pay to the UPI ID, then enter your Transaction UTR number.'
  );
  // Submissions state
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  // Users state
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  // Sync state
  const [imfJson, setImfJson] = useState('');
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
          setPayAmount(data.settings.amount || 19);
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
  const handleUserAction = async (userId: string, action: 'grant_access' | 'reset_usage') => {
    setBusy(`user_${userId}`);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage({ type: 'success', text: data.message || 'User updated.' });
      void fetchUsers();
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
      setMessage({
        type: 'success',
        text: body ? 'IMF data synced successfully.' : `Mutual funds synced: ${result.synced}.`,
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
          className={`tab ${activeTab === 'payments' ? 'tab-active font-bold' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          📱 UPI &amp; QR Settings
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'submissions' ? 'tab-active font-bold' : ''}`}
          onClick={() => {
            setActiveTab('submissions');
            void fetchSubmissions();
          }}
        >
          💳 Payment Submissions ({submissions.filter((s) => s.status === 'pending').length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'users' ? 'tab-active font-bold' : ''}`}
          onClick={() => {
            setActiveTab('users');
            void fetchUsers();
          }}
        >
          👥 Users &amp; Quotas ({usersList.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'sync' ? 'tab-active font-bold' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          🔄 Dataset Sync
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
            Customize the ₹19 paywall payment details, UPI ID, QR code image, and instructions shown
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
                              className="btn btn-success btn-xs font-bold"
                            >
                              Approve (+30d)
                            </button>
                            <button
                              type="button"
                              disabled={busy === `sub_${sub.id}`}
                              onClick={() => void handleProcessPayment(sub.id, 'reject')}
                              className="btn btn-ghost btn-xs text-error"
                            >
                              Reject
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
                Track user calculation usage, subscription statuses, and grant access overrides.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="btn btn-outline btn-xs"
            >
              Refresh
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
                    <th>Usage (10 Limit)</th>
                    <th>Subscription</th>
                    <th>Expires At</th>
                    <th className="text-right">Manual Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    const isOverLimit = u.api_usage_count >= 10;
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
                          <span
                            className={`font-mono text-xs font-bold ${isOverLimit && u.role !== 'admin' ? 'text-error' : 'text-primary'}`}
                          >
                            {u.api_usage_count} / 10
                          </span>
                        </td>
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
                          <div className="inline-flex gap-1">
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() => void handleUserAction(u.id, 'grant_access')}
                              className="btn btn-outline btn-xs"
                              title="Grant 30 Days Access"
                            >
                              +30d Access
                            </button>
                            <button
                              type="button"
                              disabled={busy === `user_${u.id}`}
                              onClick={() => void handleUserAction(u.id, 'reset_usage')}
                              className="btn btn-ghost btn-xs text-xs"
                              title="Reset usage counter to 0"
                            >
                              Reset
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
        </div>
      )}
    </main>
  );
};
export default Admin;
