import React from 'react';
import { FiShare2, FiFolder, FiCopy, FiCheck, FiDownload, FiPrinter } from 'react-icons/fi';
import { SiGoogledrive } from 'react-icons/si';
import { BsCloudArrowUp } from 'react-icons/bs';
import styles from '../NotesEditor.module.scss';
import { DropdownType, MobileMenuType } from './types';
interface EditorShareDropdownProps {
  isTrash: boolean;
  copySuccess: boolean;
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  setActiveMobileMenu: (menu: MobileMenuType) => void;
  onOpenMoveModal: () => void;
  onDumpToGoogleDrive: () => void;
  onDumpToOneDrive: () => void;
  onOpenBackupModal?: () => void;
  onCopy: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onPrint: () => void;
  onDuplicateNote: () => void;
}
export const EditorShareDropdown: React.FC<EditorShareDropdownProps> = ({
  isTrash, copySuccess, activeDropdown, setActiveDropdown, setActiveMobileMenu,
  onOpenMoveModal, onDumpToGoogleDrive, onDumpToOneDrive, onOpenBackupModal,
  onCopy, onExportMarkdown, onExportText, onPrint, onDuplicateNote,
}) => {
  const isOpen = activeDropdown === 'share';
  const handleAction = (action: () => void) => {
    action();
    setActiveDropdown(null);
  };
  return (
    <div className={styles.dropdownContainer}>
      <button
        type="button"
        onClick={() => {
          setActiveMobileMenu(null);
          setActiveDropdown(isOpen ? null : 'share');
        }}
        className={`${styles.iconBtn} ${isOpen ? styles.active : ''}`}
        title="Share & Export"
      >
        <FiShare2 size={16} />
      </button>
      {isOpen && (
        <ul className={`${styles.dropdownMenu} ${styles.alignRight} ${styles.dropdownWidth13}`}>
          {!isTrash && (
            <li>
              <button
                type="button"
                onClick={() => handleAction(onOpenMoveModal)}
                className={styles.dropdownItem}
              >
                <FiFolder size={14} color="var(--color-primary)" />
                Move to Folder...
              </button>
            </li>
          )}
          <li>
            <button
              type="button"
              onClick={() => handleAction(onDumpToGoogleDrive)}
              className={styles.dropdownItem}
            >
              <SiGoogledrive size={14} color="var(--color-info)" />
              Save to Google Drive
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => handleAction(onDumpToOneDrive)}
              className={styles.dropdownItem}
            >
              <svg className={styles.svgOneDrive} viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
              Save to OneDrive
            </button>
          </li>
          {onOpenBackupModal && (
            <li>
              <button
                type="button"
                onClick={() => handleAction(onOpenBackupModal)}
                className={`${styles.dropdownItem} ${styles.dropdownItemPrimary}`}
              >
                <BsCloudArrowUp size={14} />
                Backup & Restore
              </button>
            </li>
          )}
          <li className={styles.dropdownDivider} />
          <li>
            <button type="button" onClick={() => handleAction(onCopy)} className={styles.dropdownItem}>
              <span className={styles.flexGap05}>
                <FiCopy size={14} />
                Copy Content
              </span>
              {copySuccess && <FiCheck size={14} color="var(--color-success)" />}
            </button>
          </li>
          <li>
            <button type="button" onClick={() => handleAction(onExportMarkdown)} className={styles.dropdownItem}>
              <FiDownload size={14} />
              Download (.md)
            </button>
          </li>
          <li>
            <button type="button" onClick={() => handleAction(onExportText)} className={styles.dropdownItem}>
              <FiDownload size={14} />
              Download (.txt)
            </button>
          </li>
          <li>
            <button type="button" onClick={() => handleAction(onPrint)} className={styles.dropdownItem}>
              <FiPrinter size={14} />
              Print / Save PDF
            </button>
          </li>
          {!isTrash && (
            <li>
              <button type="button" onClick={() => handleAction(onDuplicateNote)} className={styles.dropdownItem}>
                <FiCopy size={14} />
                Duplicate Note
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
