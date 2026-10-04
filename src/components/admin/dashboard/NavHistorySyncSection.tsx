import React from 'react';
import type { NavHistoryCheckpoint, NavHistorySyncReport } from '../../../actions/admin/navHistoryTypes';
import styles from '../../../views/Admin.module.scss';
interface NavHistorySyncSectionProps {
  fromDate: string;
  toDate: string;
  schemeCodes: string;
  report: NavHistorySyncReport | null;
  checkpoint: NavHistoryCheckpoint | null;
  validation: { isValid: boolean; days: number; error?: string };
  busy: string | null;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onSchemeCodesChange: (val: string) => void;
  onShift: (direction: 'back' | 'forward') => void;
  onLoadNextWindow: () => void;
  onSync: (from?: string, to?: string) => void;
}
export const NavHistorySyncSection: React.FC<NavHistorySyncSectionProps> = ({
  fromDate,
  toDate,
  schemeCodes,
  report,
  checkpoint,
  validation,
  busy,
  onFromDateChange,
  onToDateChange,
  onSchemeCodesChange,
  onShift,
  onLoadNextWindow,
  onSync,
}) => {
  const isBusy = busy === 'sync-nav-history';
  const nextTarget = report
    ? { from: report.nextFromDate, to: report.nextToDate, fromAmfi: report.nextFromAmfi, toAmfi: report.nextToAmfi }
    : checkpoint
      ? { from: checkpoint.nextFrom, to: checkpoint.nextTo, fromAmfi: checkpoint.nextFrom, toAmfi: checkpoint.nextTo }
      : null;
  return (
    <section className={styles.card}>
      <div className={styles.cardHeaderBetween}>
        <div>
          <h2 className={styles.sectionTitle}>AMFI Historical NAV Sync (90-Day Interval)</h2>
          <p className={styles.sectionDesc}>
            Download and store historical daily NAVs from official AMFI in 90-day chunks (AMFI maximum limit).
          </p>
        </div>
        <span className={`${styles.badge} ${validation.isValid ? styles.badgeSuccess : styles.badgeError}`}>
          {validation.days} days {validation.isValid ? '(Valid 90-day block)' : '(Max 90 days)'}
        </span>
      </div>
      <div className={`${styles.formGrid} ${styles.formGridCompact}`}>
        <label className={styles.cardLabel}>
          <span className={styles.label}>Start Date (From)</span>
          <input className={styles.input} type="date" value={fromDate} onChange={(e) => onFromDateChange(e.target.value)} />
        </label>
        <label className={styles.cardLabel}>
          <span className={styles.label}>End Date (To)</span>
          <input className={styles.input} type="date" value={toDate} onChange={(e) => onToDateChange(e.target.value)} />
        </label>
      </div>
      <label className={`${styles.cardLabel} ${styles.mb1} ${styles.cardLabelSpaced}`}>
        <span className={styles.label}>Target Scheme Codes (Optional - leave blank for all funds)</span>
        <input
          className={`${styles.input} ${styles.inputMono}`}
          type="text"
          value={schemeCodes}
          onChange={(e) => onSchemeCodesChange(e.target.value)}
          placeholder="120503, 122639 — blank to sync all mutual funds in India"
        />
      </label>
      {validation.error && <p className={`${styles.sectionDesc} ${styles.validationErrorText}`}>{validation.error}</p>}
      <div className={styles.actionsRowSpaced}>
        <button className={styles.btnPrimarySm} type="button" disabled={busy !== null || !validation.isValid} onClick={() => onSync()}>
          {isBusy ? 'Fetching & Storing AMFI History...' : 'Sync 90-Day History'}
        </button>
        <button className={styles.btnSecondarySm} type="button" disabled={busy !== null} onClick={() => onShift('back')}>
          « Shift 90 Days Back
        </button>
        <button className={styles.btnSecondarySm} type="button" disabled={busy !== null} onClick={() => onShift('forward')}>
          Shift 90 Days Forward »
        </button>
      </div>
      {report && (
        <div className={styles.syncReportBox}>
          <div className={styles.syncReportHeader}>
            <strong className={styles.syncReportTitle}>Sync Result: {report.fromAmfi} to {report.toAmfi}</strong>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Completed in {(report.elapsedMs / 1000).toFixed(1)}s</span>
          </div>
          <p className={`${styles.sectionDesc} ${styles.syncDescText}`}>
            Merged <strong>{report.schemesUpdated.toLocaleString()}</strong> of <strong>{report.totalSchemes.toLocaleString()}</strong> schemes
            ({report.totalRecords.toLocaleString()} daily records in AMFI 90-day file).
            {report.hasMoreSchemes && ' (35s execution budget reached for this run; click Sync again to continue window, or advance).'}
          </p>
          <div className={styles.nextSyncBox}>
            <span className={styles.nextSyncLabel}>Ready for next sync:</span>
            <span className={`${styles.inputMono} ${styles.nextSyncMono}`}>{report.nextFromAmfi} → {report.nextToAmfi}</span>
            <button className={`${styles.btnSecondarySm} ${styles.nextSyncLoadBtn}`} type="button" disabled={busy !== null} onClick={onLoadNextWindow}>
              Load Next Window
            </button>
            <button className={styles.btnPrimarySm} type="button" disabled={busy !== null} onClick={() => onSync(report.nextFromDate, report.nextToDate)}>
              Sync Next 90 Days Now
            </button>
          </div>
        </div>
      )}
      {!report && nextTarget && (
        <div className={styles.checkpointBox}>
          <span>Last sync checkpoint recorded. Ready for interval: <strong>{nextTarget.fromAmfi} → {nextTarget.toAmfi}</strong></span>
          <button className={styles.btnSecondarySm} type="button" disabled={busy !== null} onClick={onLoadNextWindow}>
            Load Next Window
          </button>
        </div>
      )}
    </section>
  );
};
