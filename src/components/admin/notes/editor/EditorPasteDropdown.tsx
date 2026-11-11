import React from 'react';
import { BsClipboard, BsClipboardCheck } from 'react-icons/bs';
import { FiChevronDown } from 'react-icons/fi';
import { DropdownType } from './types';
import styles from '../NotesEditor.module.scss';

interface EditorPasteDropdownProps {
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  onPasteRich: () => void;
  onPastePlain: () => void;
}

export const EditorPasteDropdown: React.FC<EditorPasteDropdownProps> = ({
  activeDropdown,
  setActiveDropdown,
  onPasteRich,
  onPastePlain,
}) => {
  const isOpen = activeDropdown === 'paste';
  return (
    <div className={styles.dropdownContainer}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        onClick={() => setActiveDropdown(isOpen ? null : 'paste')}
        className={`${styles.toolbarSelectBtn} ${isOpen ? styles.active : ''}`}
        title="Paste options (Cmd+V for formatted, Cmd+Shift+V for plain text)"
        aria-label="Paste options"
      >
        <BsClipboard size={14} className={styles.iconMr025} />
        <span>Paste</span>
        <FiChevronDown className={styles.arrowDownSmall} />
      </button>
      {isOpen && (
        <ul className={`${styles.dropdownMenu} ${styles.alignRight} ${styles.dropdownWidth13}`}>
          <li className={styles.dropdownTitle}>Paste Options</li>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => {
                onPasteRich();
                setActiveDropdown(null);
              }}
              className={styles.dropdownItem}
              title="Paste with formatting (Cmd+V)"
              aria-label="Paste with formatting (Cmd+V)"
            >
              <BsClipboard size={14} className={styles.iconMr025} />
              <div className={styles.dropdownItemCol}>
                <span className={styles.fw600}>Paste (with formatting)</span>
                <span className={styles.dropdownItemSub}>Keep styles & links (Cmd+V)</span>
              </div>
            </button>
          </li>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              onClick={() => {
                onPastePlain();
                setActiveDropdown(null);
              }}
              className={styles.dropdownItem}
              title="Paste as plain text (Cmd+Shift+V)"
              aria-label="Paste as plain text (Cmd+Shift+V)"
            >
              <BsClipboardCheck size={14} className={styles.iconMr025} />
              <div className={styles.dropdownItemCol}>
                <span className={styles.fw600}>Paste as Plain Text</span>
                <span className={styles.dropdownItemSub}>Strip formatting (Cmd+Shift+V)</span>
              </div>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
