import React from 'react';
import styles from '../NotesEditor.module.scss';
import { DropdownType } from './types';
interface EditorHeadingDropdownProps {
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  onFormatBlock: (tag: string) => void;
}
export const EditorHeadingDropdown: React.FC<EditorHeadingDropdownProps> = ({
  activeDropdown,
  setActiveDropdown,
  onFormatBlock,
}) => {
  const isOpen = activeDropdown === 'format';
  return (
    <div className={styles.dropdownContainer}>
      <button
        type="button"
        onClick={() => setActiveDropdown(isOpen ? null : 'format')}
        className={`${styles.toolbarSelectBtn} ${isOpen ? styles.active : ''}`}
        title="Heading style"
      >
        Format
      </button>
      {isOpen && (
        <ul className={`${styles.dropdownMenu} ${styles.alignLeft} ${styles.dropdownWidth9}`}>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onFormatBlock('<h1>');
                setActiveDropdown(null);
              }}
              className={`${styles.dropdownItem} ${styles.fw700}`}
            >
              Title (H1)
            </button>
          </li>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onFormatBlock('<h2>');
                setActiveDropdown(null);
              }}
              className={`${styles.dropdownItem} ${styles.fw600}`}
            >
              Heading (H2)
            </button>
          </li>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onFormatBlock('<h3>');
                setActiveDropdown(null);
              }}
              className={`${styles.dropdownItem} ${styles.fw500}`}
            >
              Subheading (H3)
            </button>
          </li>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onFormatBlock('<p>');
                setActiveDropdown(null);
              }}
              className={styles.dropdownItem}
            >
              Body Text
            </button>
          </li>
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onFormatBlock('<pre>');
                setActiveDropdown(null);
              }}
              className={`${styles.dropdownItem} ${styles.fontMono}`}
            >
              Monospaced
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
