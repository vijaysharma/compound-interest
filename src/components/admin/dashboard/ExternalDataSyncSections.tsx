import React from 'react';
import styles from '../../../views/Admin.module.scss';
interface ExternalDataSyncSectionsProps {
  imfJson: string;
  pppJson: string;
  busy: string | null;
  onImfJsonChange: (val: string) => void;
  onPppJsonChange: (val: string) => void;
  onSync: (endpoint: string, body?: string) => void;
  onErrorMessage: (msg: string) => void;
}
export const ExternalDataSyncSections: React.FC<ExternalDataSyncSectionsProps> = ({
  imfJson,
  pppJson,
  busy,
  onImfJsonChange,
  onPppJsonChange,
  onSync,
  onErrorMessage,
}) => (
  <>
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>Mutual Fund Schemes Sync</h2>
      <p className={styles.sectionDesc}>Fetch and cache the latest scheme list from mfapi.in.</p>
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
      <p className={styles.sectionDesc}>Paste the JSON response from the IMF DataMapper API.</p>
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
            onSync('sync-imf', JSON.stringify(JSON.parse(imfJson)));
          } catch {
            onErrorMessage('Paste valid JSON before syncing IMF data.');
          }
        }}
      >
        {busy === 'sync-imf' ? 'Syncing...' : 'Sync IMF JSON'}
      </button>
    </section>
    <section className={styles.card}>
      <h2 className={styles.sectionTitle}>World Bank PPP Sync</h2>
      <p className={styles.sectionDesc}>Fetch global Purchasing Power Parity factor datasets.</p>
      <div className={styles.mb1}>
        <button
          className={styles.btnPrimarySm}
          type="button"
          disabled={busy !== null}
          onClick={() => onSync('sync-ppp')}
        >
          {busy === 'sync-ppp' ? 'Fetching & Syncing...' : 'Sync from World Bank API'}
        </button>
      </div>
      <details className={styles.detailsCollapse}>
        <summary>Or Paste World Bank PPP JSON Manually</summary>
        <div className={styles.detailsContent}>
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
                  onSync('sync-ppp', JSON.stringify(JSON.parse(pppJson)));
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
  </>
);
