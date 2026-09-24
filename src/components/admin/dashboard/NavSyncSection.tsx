import React from 'react';
import type { NavSyncReport } from '../../../actions/admin/navSync';
import styles from '../../../views/Admin.module.scss';
const OUTCOME_BADGE: Record<NavSyncReport['schemes'][number]['outcome'], string> = {
  stored: 'badgeSuccess',
  unchanged: 'badgeGhost',
  failed: 'badgeError',
  'skipped-no-time': 'badgeWarning',
};
interface NavSyncSectionProps {
  navSchemeCodes: string;
  navReport: NavSyncReport | null;
  busy: string | null;
  onNavSchemeCodesChange: (val: string) => void;
  onSync: (endpoint: string, body?: string) => void;
}
export const NavSyncSection: React.FC<NavSyncSectionProps> = ({
  navSchemeCodes,
  navReport,
  busy,
  onNavSchemeCodesChange,
  onSync,
}) => (
  <section className={styles.card}>
    <h2 className={styles.sectionTitle}>NAV Data Sync</h2>
    <p className={styles.sectionDesc}>
      Fetches NAV history from mfapi.in and stores it. Leave empty to refresh the most stale,
      or list scheme codes to target them directly.
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
              ? ` — unchanged for ${navReport.noAdvanceCount} checks.`
              : '.'}{' '}
          Considered {navReport.considered} in {(navReport.elapsedMs / 1000).toFixed(1)}s.
        </p>
        {navReport.schemes.length === 0 ? (
          <p className={styles.sectionDesc}>Every stored scheme already matches the market date.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th>Before</th>
                  <th>After</th>
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
);
