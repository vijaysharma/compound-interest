import { useState } from 'react';
import { useAuth } from '../context/useAuth';
const Admin = () => {
  const { token: authToken, user } = useAuth();
  const [token, setToken] = useState(() => authToken || '');
  const [imfJson, setImfJson] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const sync = async (endpoint: string, body?: string) => {
    setBusy(endpoint);
    setMessage('');
    const effectiveToken = token || authToken || '';
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
      setMessage(body ? 'IMF data synced successfully.' : `Mutual funds synced: ${result.synced}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setBusy(null);
    }
  };
  const syncImf = () => {
    try {
      const parsed = JSON.parse(imfJson);
      void sync('/api/admin/sync-imf', JSON.stringify(parsed));
    } catch {
      setMessage('Paste valid JSON before syncing IMF data.');
    }
  };
  const resetUserData = () => {
    if (!window.confirm('Clear all saved user data from this browser?')) {
      return;
    }
    window.localStorage.clear();
    setMessage('All saved user data was cleared from this browser.');
  };
  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Data administration</h1>
          <p className="text-sm opacity-70">Sync the datasets used by the calculators.</p>
        </div>
        {user && (
          <div className="badge badge-primary badge-outline text-xs">Admin: {user.email}</div>
        )}
      </div>
      <section className="mb-6 border border-error p-4">
        <h2 className="mb-2 text-lg font-medium">User data</h2>
        <p className="mb-4 text-sm opacity-70">
          Clear all calculator preferences and saved selections from this browser.
        </p>
        <button className="btn btn-error" type="button" onClick={resetUserData}>
          Reset all user data
        </button>
      </section>
      <label className="mb-6 block">
        <span className="mb-1 block text-sm font-medium">Admin token</span>
        <input
          className="input input-primary w-full"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="ADMIN_SYNC_TOKEN"
        />
      </label>
      <section className="mb-6 border border-base-300 p-4">
        <h2 className="mb-2 text-lg font-medium">Mutual fund schemes</h2>
        <p className="mb-4 text-sm opacity-70">Fetch the latest scheme list from mfapi.in.</p>
        <button
          className="btn btn-primary"
          type="button"
          disabled={!token || busy !== null}
          onClick={() => void sync('/api/admin/sync-mutual-funds')}
        >
          {busy === '/api/admin/sync-mutual-funds' ? 'Syncing...' : 'Sync mutual funds'}
        </button>
      </section>
      <section className="border border-base-300 p-4">
        <h2 className="mb-2 text-lg font-medium">IMF inflation data</h2>
        <p className="mb-2 text-sm opacity-70">
          Paste the JSON response from the IMF DataMapper API.
        </p>
        <textarea
          className="textarea textarea-primary mb-4 h-64 w-full font-mono text-xs"
          value={imfJson}
          onChange={(event) => setImfJson(event.target.value)}
          placeholder='{"values":{"PCPIPCH":{...}}}'
        />
        <button
          className="btn btn-primary"
          type="button"
          disabled={!token || !imfJson.trim() || busy !== null}
          onClick={syncImf}
        >
          {busy === '/api/admin/sync-imf' ? 'Syncing...' : 'Sync IMF JSON'}
        </button>
      </section>
      {message && <p className="alert mt-4">{message}</p>}
    </main>
  );
};
export default Admin;
