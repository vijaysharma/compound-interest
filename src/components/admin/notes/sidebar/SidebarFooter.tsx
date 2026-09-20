'use client';
import React from 'react';
import { FiTrash2, FiShield, FiEdit3 } from 'react-icons/fi';
import { SYSTEM_FOLDERS } from '../NotesTypes';
import styles from '../NotesSidebar.module.scss';
interface SidebarFooterProps {
  activeFolder: string;
  activeTag: string | null;
  trashedCount: number;
  isMobileScreen?: boolean;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string | null) => void;
  onOpenSecurityModal?: () => void;
  onNewNote?: () => void;
}
export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  activeFolder,
  activeTag,
  trashedCount,
  isMobileScreen,
  onSelectFolder,
  onSelectTag,
  onOpenSecurityModal,
  onNewNote,
}) => {
  return (
    <>
      <div className={styles.dividerSection}>
        <button
          onClick={() => {
            onSelectFolder(SYSTEM_FOLDERS.TRASH);
            onSelectTag(null);
          }}
          className={`${styles.navItem} ${styles.navItemDanger} ${activeFolder === SYSTEM_FOLDERS.TRASH && !activeTag ? styles.navItemActive : ''}`}
        >
          <span className={styles.navLeft}>
            <FiTrash2 size={16} className={styles.dangerIcon} />
            <span>Recently Deleted</span>
          </span>
          {trashedCount > 0 && (
            <span className={`${styles.badge} ${styles.badgeError}`}>
              {trashedCount}
            </span>
          )}
        </button>
      </div>
      <div className={styles.securitySection}>
        <button
          onClick={onOpenSecurityModal}
          className={styles.securityBanner}
          title="End-to-End Encrypted (AES-256-GCM): Click to view details"
        >
          <div className={styles.securityHeader}>
            <span className={styles.securityTitle}>
              <FiShield size={14} className={styles.successIcon} />
              <span>End-to-End Encrypted</span>
            </span>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>
              AES-256
            </span>
          </div>
          <p className={styles.securityDesc}>
            Notes are encrypted on your device before syncing. Only you hold the key.
          </p>
        </button>
      </div>
      {isMobileScreen && onNewNote && (
        <button
          onClick={onNewNote}
          className={styles.newNoteBtn}
        >
          <FiEdit3 size={16} />
          New Note
        </button>
      )}
    </>
  );
};
