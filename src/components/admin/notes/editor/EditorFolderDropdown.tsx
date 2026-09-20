import React from 'react';
import { FiFolder, FiFolderPlus } from 'react-icons/fi';
import styles from '../NotesEditor.module.scss';
import { DropdownType, MobileMenuType } from './types';
interface EditorFolderDropdownProps {
  currentFolder: string;
  allFolderOptions: string[];
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  setActiveMobileMenu: (menu: MobileMenuType) => void;
  onSelectFolder: (folder: string) => void;
  onOpenManageFolders: () => void;
}
export const EditorFolderDropdown: React.FC<EditorFolderDropdownProps> = ({
  currentFolder,
  allFolderOptions,
  activeDropdown,
  setActiveDropdown,
  setActiveMobileMenu,
  onSelectFolder,
  onOpenManageFolders,
}) => {
  const isOpen = activeDropdown === 'folder';
  return (
    <div className={styles.dropdownContainer}>
      <button
        type="button"
        onClick={() => {
          setActiveMobileMenu(null);
          setActiveDropdown(isOpen ? null : 'folder');
        }}
        className={`${styles.folderSelector} ${isOpen ? styles.active : ''}`}
        title="Move to another folder"
      >
        <FiFolder size={14} color="var(--color-primary)" className={styles.flexShrink0} />
        <span className={styles.truncateMax140}>{currentFolder}</span>
      </button>
      {isOpen && (
        <ul className={`${styles.dropdownMenu} ${styles.alignLeft}`}>
          <li className={styles.dropdownTitle}>Move to Folder</li>
          {allFolderOptions.map((f) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => {
                  onSelectFolder(f);
                  setActiveDropdown(null);
                }}
                className={`${styles.dropdownItem} ${currentFolder === f ? styles.active : ''}`}
              >
                {f}
              </button>
            </li>
          ))}
          <li className={styles.dropdownDivider} />
          <li>
            <button
              type="button"
              onClick={() => {
                onOpenManageFolders();
                setActiveDropdown(null);
              }}
              className={`${styles.dropdownItem} ${styles.dropdownItemPrimary}`}
            >
              <FiFolderPlus size={14} />
              Manage Folders...
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
