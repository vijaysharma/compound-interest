import React from 'react';
import { FiEdit3, FiShield, FiMenu, FiChevronLeft } from 'react-icons/fi';
import styles from '../NotesEditor.module.scss';
interface EditorEmptyScreenProps {
  isMobileScreen?: boolean;
  onBackMobile?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onNewNote: () => void;
  onOpenSecurityModal?: () => void;
}
export const EditorEmptyScreen: React.FC<EditorEmptyScreenProps> = ({
  isMobileScreen,
  onBackMobile,
  onToggleSidebar,
  isSidebarOpen,
  onNewNote,
  onOpenSecurityModal,
}) => {
  return (
    <div className={styles.emptyContainer}>
      {((onBackMobile && isMobileScreen) || (onToggleSidebar && !isMobileScreen)) && (
        <div className={styles.emptyTopBar}>
          {onBackMobile && isMobileScreen && (
            <button onClick={onBackMobile} className={styles.backBtn}>
              <FiChevronLeft size={20} />
              <span>Notes</span>
            </button>
          )}
          {onToggleSidebar && !isMobileScreen && (
            <button
              onClick={onToggleSidebar}
              className={`${styles.iconBtn} ${isSidebarOpen ? styles.active : ''}`}
              title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            >
              <FiMenu size={16} />
            </button>
          )}
        </div>
      )}
      <div className={styles.emptyIconBox}>
        <FiShield size={32} />
      </div>
      <h3 className={styles.emptyTitle}>End-to-End Encrypted Notes</h3>
      <p className={styles.emptyText}>
        All your notes are encrypted with AES-256-GCM right on your device before syncing. Only you have the key.
      </p>
      <div className={styles.emptyActions}>
        <button onClick={onNewNote} className={styles.btnPrimary}>
          <FiEdit3 size={16} />
          Create New Note
        </button>
        {onOpenSecurityModal && (
          <button onClick={onOpenSecurityModal} className={`${styles.btnGhost} ${styles.success}`}>
            <FiShield size={14} />
            Security Info
          </button>
        )}
      </div>
    </div>
  );
};
