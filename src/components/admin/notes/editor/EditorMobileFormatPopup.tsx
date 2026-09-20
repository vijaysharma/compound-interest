import React from 'react';
import { FONT_SIZES } from './constants';
import styles from '../NotesEditor.module.scss';
interface EditorMobileFormatPopupProps {
  currentFontSize: string;
  onFormatBlock: (tag: string) => void;
  onApplyFontSize: (size: string, cmdVal: string) => void;
  onClose: () => void;
}
export const EditorMobileFormatPopup: React.FC<EditorMobileFormatPopupProps> = ({
  currentFontSize,
  onFormatBlock,
  onApplyFontSize,
  onClose,
}) => {
  return (
    <ul className={`${styles.mobilePopup} ${styles.alignLeft}`}>
      <li className={styles.dropdownTitle}>Heading Style</li>
      <li>
        <button
          type="button"
          onClick={() => {
            onFormatBlock('<h1>');
            onClose();
          }}
          className={`${styles.dropdownItem} ${styles.fw700}`}
        >
          Title (H1)
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            onFormatBlock('<h2>');
            onClose();
          }}
          className={`${styles.dropdownItem} ${styles.fw600}`}
        >
          Heading (H2)
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            onFormatBlock('<h3>');
            onClose();
          }}
          className={`${styles.dropdownItem} ${styles.fw500}`}
        >
          Subheading (H3)
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            onFormatBlock('<p>');
            onClose();
          }}
          className={styles.dropdownItem}
        >
          Body Text
        </button>
      </li>
      <li className={styles.dropdownDivider} />
      <li className={styles.dropdownTitle}>Font Size</li>
      {FONT_SIZES.map((fs) => {
        const isActive = currentFontSize === fs.size;
        return (
          <li key={fs.size}>
            <button
              type="button"
              onClick={() => {
                onApplyFontSize(fs.size, fs.cmdVal);
                onClose();
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
  );
};
