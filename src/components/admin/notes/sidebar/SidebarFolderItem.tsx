'use client';
import React from 'react';
import { FiFolder, FiTrash2, FiEdit2, FiX, FiCheck } from 'react-icons/fi';
import styles from '../NotesSidebar.module.scss';
interface SidebarFolderItemProps {
  folder: string;
  isEditing: boolean;
  isCurrent: boolean;
  isDragOver: boolean;
  count: number;
  renameValue: string;
  setRenameValue: (val: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSaveRename: () => void;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string | null) => void;
  onDeleteFolder: (folder: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}
export const SidebarFolderItem: React.FC<SidebarFolderItemProps> = ({
  folder,
  isEditing,
  isCurrent,
  isDragOver,
  count,
  renameValue,
  setRenameValue,
  onStartEditing,
  onCancelEditing,
  onSaveRename,
  onSelectFolder,
  onSelectTag,
  onDeleteFolder,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  if (isEditing) {
    return (
      <div className={styles.folderForm}>
        <input
          type="text"
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={onSaveRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveRename();
            if (e.key === 'Escape') onCancelEditing();
          }}
          className={styles.folderInput}
        />
        <button
          onClick={onSaveRename}
          className={styles.folderConfirmBtn}
        >
          <FiCheck size={14} />
        </button>
        <button
          onClick={onCancelEditing}
          className={styles.folderCancelBtn}
        >
          <FiX size={14} />
        </button>
      </div>
    );
  }
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`${styles.folderRow} ${
        isDragOver
          ? styles.dragOver
          : isCurrent
            ? styles.navItemActive
            : ''
      }`}
    >
      <button
        onClick={() => {
          onSelectFolder(folder);
          onSelectTag(null);
        }}
        className={styles.folderRowBtn}
      >
        <FiFolder
          size={16}
          className={isCurrent ? styles.primaryIcon : styles.secondaryIcon}
        />
        <span className={styles.folderNameText}>{folder}</span>
      </button>
      <div className={styles.folderRightCol}>
        <span className={styles.navCount}>
          {count}
        </span>
        <div className={styles.folderHoverActions}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartEditing();
            }}
            className={styles.actionIcon}
            title="Rename Folder"
          >
            <FiEdit2 size={12} />
          </button>
          {folder !== 'Notes' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  window.confirm(
                    `Delete folder "${folder}"? Notes will move to Quick Notes.`
                  )
                ) {
                  onDeleteFolder(folder);
                }
              }}
              className={`${styles.actionIcon} ${styles.danger}`}
              title="Delete Folder"
            >
              <FiTrash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
