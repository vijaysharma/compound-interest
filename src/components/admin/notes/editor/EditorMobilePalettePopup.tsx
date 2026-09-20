import React from 'react';
import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi';
import { BsTypeStrikethrough } from 'react-icons/bs';
import { TEXT_COLORS, HIGHLIGHT_COLORS } from './constants';
import styles from '../NotesEditor.module.scss';
interface EditorMobilePalettePopupProps {
  onExecCmd: (cmd: string) => void;
  onApplyTextColor: (color: string) => void;
  onApplyHighlightColor: (color: string) => void;
  onClose: () => void;
}
export const EditorMobilePalettePopup: React.FC<EditorMobilePalettePopupProps> = ({
  onExecCmd,
  onApplyTextColor,
  onApplyHighlightColor,
  onClose,
}) => {
  return (
    <div className={`${styles.mobilePopup} ${styles.alignLeft} ${styles.wide}`}>
      <div className={styles.mobileStylesHeader}>
        <span className={`${styles.dropdownTitle} ${styles.dropdownTitleNoPad}`}>Styles</span>
        <div className={styles.flexGap025}>
          <button type="button" onClick={() => onExecCmd('bold')} className={styles.toolbarBtn} title="Bold">
            <FiBold size={14} />
          </button>
          <button type="button" onClick={() => onExecCmd('italic')} className={styles.toolbarBtn} title="Italic">
            <FiItalic size={14} />
          </button>
          <button type="button" onClick={() => onExecCmd('underline')} className={styles.toolbarBtn} title="Underline">
            <FiUnderline size={14} />
          </button>
          <button type="button" onClick={() => onExecCmd('strikeThrough')} className={styles.toolbarBtn} title="Strikethrough">
            <BsTypeStrikethrough size={14} />
          </button>
        </div>
      </div>
      <div className={`${styles.dropdownTitle} ${styles.dropdownTitlePadY}`}>Text Color</div>
      <div className={styles.mobileColorGrid5}>
        {TEXT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => {
              onApplyTextColor(c.value);
              onClose();
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
      <div className={`${styles.dropdownTitle} ${styles.dropdownTitlePadY}`}>Highlight</div>
      <div className={styles.highlightGrid4}>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => {
              onApplyHighlightColor(c.value);
              onClose();
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
  );
};
