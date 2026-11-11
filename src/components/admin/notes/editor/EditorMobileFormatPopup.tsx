import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { FONT_SIZES, LINE_HEIGHTS } from './constants';
import { MobileButton } from './MobileButton';
import styles from '../NotesEditor.module.scss';
interface EditorMobileFormatPopupProps {
  currentFontSize: string;
  onFormatBlock: (tag: string) => void;
  onApplyFontSize: (size: string, cmdVal: string) => void;
  onApplyLineHeight?: (lineHeight: string) => void;
  onClose: () => void;
}
export const EditorMobileFormatPopup: React.FC<EditorMobileFormatPopupProps> = ({
  currentFontSize,
  onFormatBlock,
  onApplyFontSize,
  onApplyLineHeight,
  onClose,
}) => {
  return (
    <ul className={`${styles.mobilePopup} ${styles.alignLeft}`}>
      <li className={styles.dropdownTitle}>Heading Style</li>
      <li>
        <MobileButton
          action={() => {
            onFormatBlock('<h1>');
            onClose();
          }}
          className={`${styles.dropdownItem} ${styles.fw700}`}
        >
          Title (H1)
        </MobileButton>
      </li>
      <li>
        <MobileButton
          action={() => {
            onFormatBlock('<h2>');
            onClose();
          }}
          className={`${styles.dropdownItem} ${styles.fw600}`}
        >
          Heading (H2)
        </MobileButton>
      </li>
      <li>
        <MobileButton
          action={() => {
            onFormatBlock('<h3>');
            onClose();
          }}
          className={`${styles.dropdownItem} ${styles.fw500}`}
        >
          Subheading (H3)
        </MobileButton>
      </li>
      <li>
        <MobileButton
          action={() => {
            onFormatBlock('<p>');
            onClose();
          }}
          className={styles.dropdownItem}
        >
          Body Text
        </MobileButton>
      </li>
      <li className={styles.dropdownDivider} />
      <li className={styles.dropdownTitle}>Font Size</li>
      {FONT_SIZES.map((fs) => {
        const isActive = currentFontSize === fs.size;
        return (
          <li key={fs.size}>
            <MobileButton
              action={() => {
                onApplyFontSize(fs.size, fs.cmdVal);
                onClose();
              }}
              className={`${styles.dropdownItem} ${isActive ? styles.active : ''}`}
              style={{ fontSize: fs.size }}
            >
              <span>{fs.label}</span>
              {isActive && <FiCheck className={styles.activeCheck} />}
            </MobileButton>
          </li>
        );
      })}
      {onApplyLineHeight && (
        <>
          <li className={styles.dropdownDivider} />
          <li className={styles.dropdownTitle}>Line Height (Selection)</li>
          {LINE_HEIGHTS.map((lh) => (
            <li key={lh.value}>
              <MobileButton
                action={() => {
                  onApplyLineHeight(lh.value);
                  onClose();
                }}
                className={styles.dropdownItem}
              >
                <span>{lh.label}</span>
              </MobileButton>
            </li>
          ))}
        </>
      )}
    </ul>
  );
};
