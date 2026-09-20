'use client';
import React from 'react';
import { SyncState } from '../NotesTypes';
import styles from '../QuickNotesManager.module.scss';
interface NotesSyncBannersProps {
  loading: boolean;
  notesCount: number;
  syncState: SyncState;
  syncError: string;
  saveError: string;
  unsyncedCount: number;
  isSaving: boolean;
  onDismissSaveError: () => void;
  onFlushPendingSaves: () => void;
  onRetrySync: () => void;
}
export const NotesSyncBanners: React.FC<NotesSyncBannersProps> = ({
  loading,
  notesCount,
  syncState,
  syncError,
  saveError,
  unsyncedCount,
  isSaving,
  onDismissSaveError,
  onFlushPendingSaves,
  onRetrySync,
}) => {
  return (
    <>
      {loading && notesCount === 0 && (
        <div className={styles.loadingOverlay}>
          <span className={styles.spinner}></span>
        </div>
      )}
      <div className={styles.syncBannerStack}>
        {syncState === 'unauthenticated' && (
          <div className={styles.syncBanner}>
            <span>
              You are not signed in on this device, so your notes could not be loaded.
            </span>
          </div>
        )}
        {saveError && (
          <div className={`${styles.syncBanner} ${styles.syncBannerError}`}>
            <span>{saveError}</span>
            <button type="button" className={styles.syncRetryBtn} onClick={onDismissSaveError}>
              Dismiss
            </button>
          </div>
        )}
        {unsyncedCount > 0 && (
          <div className={`${styles.syncBanner} ${styles.syncBannerPending}`}>
            <span>
              {unsyncedCount} {unsyncedCount === 1 ? 'note has' : 'notes have'} unsaved changes.
            </span>
            <button
              type="button"
              className={styles.syncRetryBtn}
              onClick={onFlushPendingSaves}
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save now'}
            </button>
          </div>
        )}
        {syncState === 'error' && (
          <div className={styles.syncBanner}>
            <span>
              Could not load your notes from storage.
              {syncError ? ` (${syncError})` : ''}
            </span>
            <button type="button" className={styles.syncRetryBtn} onClick={onRetrySync}>
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  );
};
