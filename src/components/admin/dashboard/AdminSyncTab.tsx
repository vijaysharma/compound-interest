'use client';
import React from 'react';
import type { NavSyncReport } from '../../../actions/admin/navSync';
import { NavSyncSection } from './NavSyncSection';
import { ExternalDataSyncSections } from './ExternalDataSyncSections';
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
      <NavSyncSection
        navSchemeCodes={navSchemeCodes}
        navReport={navReport}
        busy={busy}
        onNavSchemeCodesChange={onNavSchemeCodesChange}
        onSync={onSync}
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
