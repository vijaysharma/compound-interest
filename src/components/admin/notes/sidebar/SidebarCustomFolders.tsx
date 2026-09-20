'use client';
import React, { useState } from 'react';
import { FiFolderPlus, FiX, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styles from '../NotesSidebar.module.scss';
import { SidebarFolderItem } from './SidebarFolderItem';
interface SidebarCustomFoldersProps {
  folders: string[];
  activeFolder: string;
  activeTag: string | null;
  dragOverFolder: string | null;
  setDragOverFolder: (folder: string | null) => void;
  onSelectFolder: (folder: string) => void;
  onSelectTag: (tag: string | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder: (name: string) => void;
  onFolderDrop: (e: React.DragEvent, targetFolder: string) => void;
  getFolderCount: (folderName: string) => number;
}
export const SidebarCustomFolders: React.FC<SidebarCustomFoldersProps> = ({
  folders,
  activeFolder,
  activeTag,
  dragOverFolder,
  setDragOverFolder,
  onSelectFolder,
  onSelectTag,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onFolderDrop,
  getFolderCount,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [foldersCollapsed, setFoldersCollapsed] = useState(false);
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };
  const handleSaveRename = (oldName: string) => {
    if (renameValue.trim() && renameValue.trim() !== oldName) {
      onRenameFolder(oldName, renameValue.trim());
    }
    setEditingFolder(null);
    setRenameValue('');
  };
  return (
    <div>
      <div className={styles.sectionHeader}>
        <button
          onClick={() => setFoldersCollapsed(!foldersCollapsed)}
          className={styles.sectionToggle}
        >
          {foldersCollapsed ? (
            <FiChevronRight size={12} />
          ) : (
            <FiChevronDown size={12} />
          )}
          <span>Folders</span>
        </button>
        <button
          onClick={() => setIsCreatingFolder(true)}
          className={styles.folderActionBtn}
          title="New Folder"
        >
          <FiFolderPlus size={16} />
        </button>
      </div>
      {!foldersCollapsed && (
        <div className={`${styles.folderSection} ${styles.folderListContainer}`}>
          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className={styles.folderForm}>
              <input
                type="text"
                autoFocus
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className={styles.folderInput}
                onKeyDown={(e) => e.key === 'Escape' && setIsCreatingFolder(false)}
              />
              <button type="submit" className={styles.folderConfirmBtn}>
                <FiCheck size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className={styles.folderCancelBtn}
              >
                <FiX size={16} />
              </button>
            </form>
          )}
          {folders.map((folder) => (
            <SidebarFolderItem
              key={folder}
              folder={folder}
              isEditing={editingFolder === folder}
              isCurrent={activeFolder === folder && !activeTag}
              isDragOver={dragOverFolder === folder}
              count={getFolderCount(folder)}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              onStartEditing={() => {
                setEditingFolder(folder);
                setRenameValue(folder);
              }}
              onCancelEditing={() => setEditingFolder(null)}
              onSaveRename={() => handleSaveRename(folder)}
              onSelectFolder={onSelectFolder}
              onSelectTag={onSelectTag}
              onDeleteFolder={onDeleteFolder}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverFolder(folder);
              }}
              onDragLeave={() => setDragOverFolder(null)}
              onDrop={(e) => onFolderDrop(e, folder)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
