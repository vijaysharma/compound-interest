'use client';
import React from 'react';
import { FiFolder, FiX } from 'react-icons/fi';
import { BsCloudArrowUp } from 'react-icons/bs';
import styles from '../NotesSidebar.module.scss';
interface SidebarHeaderProps {
  isMobileScreen?: boolean;
  onOpenBackupModal?: () => void;
  onClose?: () => void;
  onCloseMobile?: () => void;
}
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isMobileScreen,
  onOpenBackupModal,
  onClose,
  onCloseMobile,
}) => {
  const handleClose = onClose || onCloseMobile;
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <div className={styles.logoBox}>
          {isMobileScreen ? <FiFolder size={20} className={styles.primaryIcon} /> : '📝'}
        </div>
        <div>
          <span className={styles.title}>
            {isMobileScreen ? 'Folders' : 'Quick Notes'}
          </span>
          {isMobileScreen && (
            <span className={styles.subtitle}>All Folders &amp; Tags</span>
          )}
        </div>
      </div>
      <div className={styles.headerActions}>
        {onOpenBackupModal && (
          <button
            onClick={onOpenBackupModal}
            className={styles.iconBtn}
            title="Backup & Restore (Google Drive / OneDrive)"
          >
            <BsCloudArrowUp size={16} />
          </button>
        )}
        {handleClose && (
          <button
            onClick={handleClose}
            className={styles.closeBtn}
            title={isMobileScreen ? 'Back to notes' : 'Close sidebar'}
            aria-label={isMobileScreen ? 'Back to notes' : 'Close sidebar'}
          >
            <FiX size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
