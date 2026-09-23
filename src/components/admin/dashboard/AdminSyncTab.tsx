'use client';
import React from 'react';
import type { NavSyncReport } from '../../../actions/admin/navSync';
import styles from '../../../views/Admin.module.scss';
export interface AdminSyncTabProps {
  token: string;
  imfJson: string;
  pppJson: string;
  navSchemeCodes: string;
  navReport: NavSyncReport | null;
  busy: string | null;
  onTokenChange: (val: string) => void;
  onImfJsonChange: (val: string) => void;
  onPppJsonChange: (val: string) => void;
  onNavSchemeCodesChange: (val: string) => void;
  onSync: (endpoint: string, body?: string) => void;
  onErrorMessage: (msg: string) => void;
}
/** Colours the per-scheme outcome so a failure is visible without reading. */
const OUTCOME_BADGE: Record<NavSyncReport['schemes'][number]['outcome'], string> = {
  stored: 'badgeSuccess',
  // `unchanged` is a normal, healthy result — upstream simply had nothing
  // newer — so it gets the neutral treatment, not a warning.
  unchanged: 'badgeGhost',
  failed: 'badgeError',
  'skipped-no-time': 'badgeWarning',
};
export const AdminSyncTab: React.FC<AdminSyncTabProps> = React.memo(
  ({
    token,
    imfJson,
    pppJson,
    navSchemeCodes,
    navReport,
    busy,
    onTokenChange,
    onImfJsonChange,
    onPppJsonChange,
    onNavSchemeCodesChange,
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
        <h2 className={styles.sectionTitle}>NAV Data Sync</h2>
        <p className={styles.sectionDesc}>
          Fetches NAV history from mfapi.in and stores it, for when the nightly
          cron did not run or an AMC published late. Backoff is bypassed, so a
          scheme is fetched even if it was tried recently. Leave the box empty to
          refresh whichever schemes are furthest behind, or list scheme codes to
          target them directly.
        </p>
        <label className={`${styles.cardLabel} ${styles.mb1}`}>
          <span className={styles.label}>Scheme codes (optional)</span>
          <input
            className={`${styles.input} ${styles.inputMono}`}
            type="text"
            value={navSchemeCodes}
            onChange={(e) => onNavSchemeCodesChange(e.target.value)}
            placeholder="118825, 120503 — blank for the most stale"
          />
        </label>
        <button
          className={styles.btnPrimarySm}
          type="button"
          disabled={busy !== null}
          onClick={() => onSync('sync-nav')}
        >
          {busy === 'sync-nav' ? 'Fetching NAV data...' : 'Sync NAV Data'}
        </button>
        {navReport && (
          <>
            <p className={styles.sectionDesc}>
              Market as of <strong>{navReport.watermark ?? 'unknown'}</strong>
              {navReport.watermarkAdvanced
                ? ' — advanced on this run.'
                : navReport.noAdvanceCount > 0
                  ? ` — unchanged for ${navReport.noAdvanceCount} consecutive checks, so the provider has published nothing newer.`
                  : '.'}{' '}
              Considered {navReport.considered} in {(navReport.elapsedMs / 1000).toFixed(1)}s.
            </p>
            {navReport.schemes.length === 0 ? (
              <p className={styles.sectionDesc}>
                Nothing to do — every stored scheme already matches the market date.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Scheme</th>
                      <th>Latest NAV before</th>
                      <th>after</th>
                      <th className={styles.tableRight}>Rows</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {navReport.schemes.map((row) => (
                      <tr key={row.schemeCode}>
                        <td>
                          <div>{row.schemeName ?? '—'}</div>
                          <div className={styles.inputMono}>{row.schemeCode}</div>
                        </td>
                        <td>{row.before ?? '—'}</td>
                        <td>{row.after ?? '—'}</td>
                        <td className={styles.tableRight}>
                          {row.rowsAfter}
                          {row.rowsAfter !== row.rowsBefore && ` (+${row.rowsAfter - row.rowsBefore})`}
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles[OUTCOME_BADGE[row.outcome]]}`}>
                            {row.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
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
