import React from 'react';
import { FiBold, FiItalic, FiUnderline, FiX } from 'react-icons/fi';
import { BsTypeStrikethrough } from 'react-icons/bs';
import { TEXT_COLORS, HIGHLIGHT_COLORS } from './constants';
import { MobileButton } from './MobileButton';
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
          <MobileButton action={() => onExecCmd('bold')} className={styles.toolbarBtn} title="Bold">
            <FiBold size={14} />
          </MobileButton>
          <MobileButton action={() => onExecCmd('italic')} className={styles.toolbarBtn} title="Italic">
            <FiItalic size={14} />
          </MobileButton>
          <MobileButton action={() => onExecCmd('underline')} className={styles.toolbarBtn} title="Underline">
            <FiUnderline size={14} />
          </MobileButton>
          <MobileButton action={() => onExecCmd('strikeThrough')} className={styles.toolbarBtn} title="Strikethrough">
            <BsTypeStrikethrough size={14} />
          </MobileButton>
        </div>
      </div>
      <div className={`${styles.dropdownTitle} ${styles.dropdownTitlePadY}`}>Text Color</div>
      <div className={styles.mobileColorGrid5}>
        {TEXT_COLORS.map((c) => (
          <MobileButton
            key={c.value}
            action={() => {
              onApplyTextColor(c.value);
              onClose();
            }}
            className={styles.colorSwatch}
            style={{ backgroundColor: c.value === 'inherit' ? 'var(--color-heading)' : c.value }}
            title={c.label}
          />
        ))}
      </div>
      <div className={styles.dropdownDivider} />
      <div className={`${styles.dropdownTitle} ${styles.dropdownTitlePadY}`}>Highlight</div>
      <div className={styles.highlightGrid4}>
        {HIGHLIGHT_COLORS.map((c) => (
          <MobileButton
            key={c.value}
            action={() => {
              onApplyHighlightColor(c.value);
              onClose();
            }}
            className={styles.colorSwatch}
            style={{ backgroundColor: c.value === 'transparent' ? 'transparent' : c.value }}
            title={c.label}
          >
            {c.value === 'transparent' ? <FiX size={12} /> : null}
          </MobileButton>
        ))}
      </div>
    </div>
  );
};
