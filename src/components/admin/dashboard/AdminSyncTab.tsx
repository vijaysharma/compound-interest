'use client';
import React from 'react';
import styles from '../../../views/Admin.module.scss';
export interface AdminSyncTabProps {
  token: string;
  imfJson: string;
  pppJson: string;
  busy: string | null;
  onTokenChange: (val: string) => void;
  onImfJsonChange: (val: string) => void;
  onPppJsonChange: (val: string) => void;
  onSync: (endpoint: string, body?: string) => void;
  onErrorMessage: (msg: string) => void;
}
export const AdminSyncTab: React.FC<AdminSyncTabProps> = React.memo(
  ({
    token,
    imfJson,
    pppJson,
    busy,
    onTokenChange,
    onImfJsonChange,
    onPppJsonChange,
    onSync,
    onErrorMessage,
  }) => (
    <div className={styles.syncContainer}>
      <label className={`${styles.card} ${styles.cardLabel}`}>
        <span className={styles.label}>Admin Auth Token Override</span>
        <input
          className={`${styles.input} ${styles.inputMono}`}
          type="password"
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
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
          onClick={() => onSync('sync-mutual-funds')}
        >
          {busy === 'sync-mutual-funds' ? 'Syncing...' : 'Sync Mutual Funds'}
        </button>
      </section>
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>IMF Inflation Data Sync</h2>
        <p className={styles.sectionDesc}>
          Paste the JSON response from the IMF DataMapper API.
        </p>
        <textarea
          className={`${styles.textarea} ${styles.syncTextareaImf}`}
          value={imfJson}
          onChange={(e) => onImfJsonChange(e.target.value)}
          placeholder='{"values":{"PCPIPCH":{...}}}'
        />
        <button
          className={styles.btnPrimarySm}
          type="button"
          disabled={!imfJson.trim() || busy !== null}
          onClick={() => {
            try {
              const parsed = JSON.parse(imfJson);
              onSync('sync-imf', JSON.stringify(parsed));
            } catch {
              onErrorMessage('Paste valid JSON before syncing IMF data.');
            }
          }}
        >
          {busy === 'sync-imf' ? 'Syncing...' : 'Sync IMF JSON'}
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
        <div className={styles.mb1}>
          <button
            className={styles.btnPrimarySm}
            type="button"
            disabled={busy !== null}
            onClick={() => onSync('sync-ppp')}
          >
            {busy === 'sync-ppp'
              ? 'Fetching & Syncing from World Bank...'
              : 'Sync from World Bank API'}
          </button>
        </div>
        <details className={styles.detailsCollapse}>
          <summary>
            Or Paste World Bank PPP JSON Manually
          </summary>
          <div className={styles.detailsContent}>
            <p className={styles.detailsHelpText}>
              Paste the JSON response array from
              api.worldbank.org/v2/country/all/indicator/PA.NUS.PPP.
            </p>
            <textarea
              className={`${styles.textarea} ${styles.syncTextareaPpp}`}
              value={pppJson}
              onChange={(e) => onPppJsonChange(e.target.value)}
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
                    onSync('sync-ppp', JSON.stringify(parsed));
                  } catch {
                    onErrorMessage('Paste valid JSON before syncing PPP data.');
                  }
                }}
              >
                {busy === 'sync-ppp' ? 'Syncing...' : 'Sync Pasted PPP JSON'}
              </button>
            </div>
          </div>
        </details>
      </section>
    </div>
  )
);
AdminSyncTab.displayName = 'AdminSyncTab';
