'use client';
import React from 'react';
import type { NavSyncReport } from '../../../actions/admin/navSync';
import type { useAdminNavHistorySync } from './useAdminNavHistorySync';
import { NavSyncSection } from './NavSyncSection';
import { NavHistorySyncSection } from './NavHistorySyncSection';
import { ExternalDataSyncSections } from './ExternalDataSyncSections';
import styles from '../../../views/Admin.module.scss';
export interface AdminSyncTabProps {
  token: string;
  cronToken?: string;
  imfJson: string;
  pppJson: string;
  navSchemeCodes: string;
  navReport: NavSyncReport | null;
  busy: string | null;
  navHistory: ReturnType<typeof useAdminNavHistorySync>;
  onTokenChange: (val: string) => void;
  onCronTokenChange?: (val: string) => void;
  onImfJsonChange: (val: string) => void;
  onPppJsonChange: (val: string) => void;
  onNavSchemeCodesChange: (val: string) => void;
  onSync: (endpoint: string, body?: string) => void;
  onErrorMessage: (msg: string) => void;
}
export const AdminSyncTab: React.FC<AdminSyncTabProps> = React.memo(
  ({
    token,
    cronToken,
    imfJson,
    pppJson,
    navSchemeCodes,
    navReport,
    busy,
    navHistory,
    onTokenChange,
    onCronTokenChange,
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
      {token !== 'USE_CRON_SECRET' || cronToken ? (
        <label className={`${styles.card} ${styles.cardLabel}`}>
          <span className={styles.label}>Cron Job Secret Token</span>
          <input
            className={`${styles.input} ${styles.inputMono}`}
            type="password"
            value={cronToken || ''}
            onChange={(e) => onCronTokenChange?.(e.target.value)}
            placeholder="CRON_SECRET (for automated sync jobs)"
          />
        </label>
      ) : null}
      <NavSyncSection
        navSchemeCodes={navSchemeCodes}
        navReport={navReport}
        busy={busy}
        onNavSchemeCodesChange={onNavSchemeCodesChange}
        onSync={onSync}
      />
      <NavHistorySyncSection
        fromDate={navHistory.fromDate}
        toDate={navHistory.toDate}
        schemeCodes={navHistory.schemeCodes}
        report={navHistory.report}
        checkpoint={navHistory.checkpoint}
        validation={navHistory.validation}
        busy={busy}
        onFromDateChange={navHistory.setFromDate}
        onToDateChange={navHistory.setToDate}
        onSchemeCodesChange={navHistory.setSchemeCodes}
        onShift={navHistory.shiftWindow}
        onLoadNextWindow={navHistory.loadNextWindow}
        onSync={navHistory.syncHistory}
      />
      <ExternalDataSyncSections
        imfJson={imfJson}
        pppJson={pppJson}
        busy={busy}
        onImfJsonChange={onImfJsonChange}
        onPppJsonChange={onPppJsonChange}
        onSync={onSync}
        onErrorMessage={onErrorMessage}
      />
    </div>
  )
);
AdminSyncTab.displayName = 'AdminSyncTab';
