import React from 'react';
import { MdFormatLineSpacing } from 'react-icons/md';
import { FiChevronDown } from 'react-icons/fi';
import { LINE_HEIGHTS } from './constants';
import { DropdownType } from './types';
import styles from '../NotesEditor.module.scss';

interface EditorLineHeightDropdownProps {
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  onApplyLineHeight: (lineHeight: string) => void;
}

export const EditorLineHeightDropdown: React.FC<EditorLineHeightDropdownProps> = ({
  activeDropdown,
  setActiveDropdown,
  onApplyLineHeight,
}) => {
  const isOpen = activeDropdown === 'lineHeight';
  return (
    <div className={styles.dropdownContainer}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
        onClick={() => setActiveDropdown(isOpen ? null : 'lineHeight')}
        className={`${styles.toolbarSelectBtn} ${isOpen ? styles.active : ''}`}
        title="Line Height (Selection or Paragraph)"
        aria-label="Line Height"
      >
        <MdFormatLineSpacing size={14} className={styles.iconMr025} />
        <span>Height</span>
        <FiChevronDown className={styles.arrowDownSmall} />
      </button>
      {isOpen && (
        <ul className={`${styles.dropdownMenu} ${styles.alignLeft} ${styles.dropdownWidth9}`}>
          <li className={styles.dropdownTitle}>Line Height</li>
          {LINE_HEIGHTS.map((lh) => (
            <li key={lh.value}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => {
                  onApplyLineHeight(lh.value);
                  setActiveDropdown(null);
                }}
                className={styles.dropdownItem}
              >
                <span>{lh.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
