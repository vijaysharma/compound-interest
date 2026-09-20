import React from 'react';
import { FiChevronLeft, FiMenu, FiLock, FiUnlock, FiTrash2, FiRotateCcw } from 'react-icons/fi';
import { BsPinFill, BsPin } from 'react-icons/bs';
import { Note } from '../NotesTypes';
import { DropdownType, MobileMenuType } from './types';
import { EditorFolderDropdown } from './EditorFolderDropdown';
import { EditorShareDropdown } from './EditorShareDropdown';
import styles from '../NotesEditor.module.scss';
interface EditorTopBarProps {
  note: Note;
  isTrash: boolean;
  folders: string[];
  folderTitle?: string;
  isMobileScreen?: boolean;
  isSidebarOpen?: boolean;
  onBackMobile?: () => void;
  onToggleSidebar?: () => void;
  onTogglePin: () => void;
  onOpenLockModal: () => void;
  onRestoreNote: () => void;
  onDeleteRequest: () => void;
  onUpdateNote: (updated: Partial<Note>) => void;
  onOpenMoveModal: () => void;
  onOpenBackupModal?: () => void;
  onDuplicateNote: () => void;
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  setActiveMobileMenu: (menu: MobileMenuType) => void;
  onDumpToGoogleDrive: () => void;
  onDumpToOneDrive: () => void;
  onCopy: () => void;
  onExportMarkdown: () => void;
  onExportText: () => void;
  onPrint: () => void;
  copySuccess: boolean;
}
export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  note, isTrash, folders, folderTitle, isMobileScreen, isSidebarOpen,
  onBackMobile, onToggleSidebar, onTogglePin, onOpenLockModal, onRestoreNote,
  onDeleteRequest, onUpdateNote, onOpenMoveModal, onOpenBackupModal, onDuplicateNote,
  activeDropdown, setActiveDropdown, setActiveMobileMenu, onDumpToGoogleDrive,
  onDumpToOneDrive, onCopy, onExportMarkdown, onExportText, onPrint, copySuccess,
}) => {
  const currentFolder = note.folder || 'Quick Notes';
  const allFolderOptions = Array.from(new Set(['Quick Notes', ...folders]));
  return (
    <div className={styles.topBar}>
      <div className={styles.topBarLeft}>
        {onBackMobile && (
          <button onClick={onBackMobile} className={styles.backBtn}>
            <FiChevronLeft size={20} />
            <span className={styles.truncateMax100}>{folderTitle || 'Notes'}</span>
          </button>
        )}
        {onToggleSidebar && !isMobileScreen && (
          <button
            onClick={onToggleSidebar}
            className={`${styles.iconBtn} ${isSidebarOpen ? styles.active : ''}`}
            title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            aria-label={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          >
            <FiMenu size={16} />
          </button>
        )}
        {!isTrash && (
          <EditorFolderDropdown
            currentFolder={currentFolder}
            allFolderOptions={allFolderOptions}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
            setActiveMobileMenu={setActiveMobileMenu}
            onSelectFolder={(folder) => onUpdateNote({ folder })}
            onOpenManageFolders={onOpenMoveModal}
          />
        )}
      </div>
      <div className={styles.topBarRight}>
        {!isTrash && (
          <>
            <button
              onClick={onTogglePin}
              className={`${styles.iconBtn} ${note.is_pinned ? styles.active : ''}`}
              title={note.is_pinned ? 'Unpin Note' : 'Pin Note'}
            >
              {note.is_pinned ? <BsPinFill size={16} /> : <BsPin size={16} />}
            </button>
            <button
              onClick={onOpenLockModal}
              className={`${styles.iconBtn} ${note.is_locked ? styles.active : ''}`}
              title={note.is_locked ? 'Lock Settings' : 'Lock Note'}
            >
              {note.is_locked ? <FiLock size={16} /> : <FiUnlock size={16} />}
            </button>
          </>
        )}
        <EditorShareDropdown
          isTrash={isTrash}
          copySuccess={copySuccess}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          setActiveMobileMenu={setActiveMobileMenu}
          onOpenMoveModal={onOpenMoveModal}
          onDumpToGoogleDrive={onDumpToGoogleDrive}
          onDumpToOneDrive={onDumpToOneDrive}
          onOpenBackupModal={onOpenBackupModal}
          onCopy={onCopy}
          onExportMarkdown={onExportMarkdown}
          onExportText={onExportText}
          onPrint={onPrint}
          onDuplicateNote={onDuplicateNote}
        />
        {isTrash ? (
          <div className={styles.flexGap025}>
            <button
              onClick={onRestoreNote}
              className={`${styles.btnGhost} ${styles.success} ${styles.btnMinHeight38}`}
              title="Restore Note"
            >
              <FiRotateCcw size={16} className={styles.iconMr025} />
              Put Back
            </button>
            <button
              onClick={onDeleteRequest}
              className={`${styles.btnGhost} ${styles.btnDangerMin38}`}
              title="Delete Permanently"
            >
              <FiTrash2 size={16} className={styles.iconMr025} />
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={onDeleteRequest}
            className={`${styles.iconBtn} ${styles.danger}`}
            title="Move to Trash"
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
