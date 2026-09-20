import React from 'react';
import { BsPalette } from 'react-icons/bs';
import { FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS } from './constants';
import { DropdownType } from './types';
import styles from '../NotesEditor.module.scss';
interface EditorFontAndColorDropdownsProps {
  currentFontSize: string;
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  onApplyFontSize: (size: string, cmdVal: string) => void;
  onApplyTextColor: (color: string) => void;
  onApplyHighlightColor: (color: string) => void;
}
export const EditorFontAndColorDropdowns: React.FC<EditorFontAndColorDropdownsProps> = ({
  currentFontSize,
  activeDropdown,
  setActiveDropdown,
  onApplyFontSize,
  onApplyTextColor,
  onApplyHighlightColor,
}) => {
  const isFontSizeOpen = activeDropdown === 'fontSize';
  const isPaletteOpen = activeDropdown === 'palette';
  return (
    <>
      <div className={styles.dropdownContainer}>
        <button
          type="button"
          onClick={() => setActiveDropdown(isFontSizeOpen ? null : 'fontSize')}
          className={`${styles.toolbarSelectBtn} ${isFontSizeOpen ? styles.active : ''}`}
          title={`Font size: ${FONT_SIZES.find((f) => f.size === currentFontSize)?.label || 'Normal'} (${currentFontSize})`}
        >
          <span>{FONT_SIZES.find((f) => f.size === currentFontSize)?.label || 'Size'}</span>
          <span className={styles.arrowDownSmall}>▼</span>
        </button>
        {isFontSizeOpen && (
          <ul className={`${styles.dropdownMenu} ${styles.alignLeft} ${styles.dropdownWidth9}`}>
            {FONT_SIZES.map((fs) => {
              const isActive = currentFontSize === fs.size;
              return (
                <li key={fs.size}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onApplyFontSize(fs.size, fs.cmdVal);
                      setActiveDropdown(null);
                    }}
                    className={`${styles.dropdownItem} ${isActive ? styles.active : ''}`}
                    ref={(el) => {
                      if (el) el.style.fontSize = fs.size;
                    }}
                  >
                    <span>{fs.label}</span>
                    {isActive && <span className={styles.activeCheck}>✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className={styles.dropdownContainer}>
        <button
          type="button"
          onClick={() => setActiveDropdown(isPaletteOpen ? null : 'palette')}
          className={`${styles.toolbarBtn} ${styles.primary} ${isPaletteOpen ? styles.active : ''}`}
          title="Color & Highlight"
        >
          <BsPalette size={14} />
        </button>
        {isPaletteOpen && (
          <div className={`${styles.dropdownMenu} ${styles.alignLeft} ${styles.paletteDropdown}`}>
            <div className={styles.dropdownTitle}>Text Color</div>
            <div className={styles.colorGrid5}>
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onApplyTextColor(c.value);
                    setActiveDropdown(null);
                  }}
                  className={styles.colorSwatch}
                  ref={(el) => {
                    if (el) el.style.backgroundColor = c.value === 'inherit' ? 'var(--color-heading)' : c.value;
                  }}
                  title={c.label}
                />
              ))}
            </div>
            <div className={styles.dropdownDivider} />
            <div className={styles.dropdownTitle}>Highlight Color</div>
            <div className={styles.highlightGrid4}>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onApplyHighlightColor(c.value);
                    setActiveDropdown(null);
                  }}
                  className={styles.colorSwatch}
                  ref={(el) => {
                    if (el) el.style.backgroundColor = c.value === 'transparent' ? 'transparent' : c.value;
                  }}
                  title={c.label}
                >
                  {c.value === 'transparent' ? '✕' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
