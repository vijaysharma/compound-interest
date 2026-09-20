import React, { RefObject } from 'react';
import {
  BsCardChecklist, BsPalette,
  BsArrowCounterclockwise, BsArrowClockwise,
} from 'react-icons/bs';
import { MobileMenuType, ViewportState } from './types';
import { EditorMobileFormatPopup } from './EditorMobileFormatPopup';
import { EditorMobilePalettePopup } from './EditorMobilePalettePopup';
import { EditorMobileExtraTools } from './EditorMobileExtraTools';
import styles from '../NotesEditor.module.scss';
interface EditorToolbarMobileProps {
  editorRef: RefObject<HTMLDivElement | null>;
  currentFontSize: string;
  viewportState: ViewportState;
  activeMobileMenu: MobileMenuType;
  setActiveMobileMenu: (menu: MobileMenuType) => void;
  copySuccess: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExecCmd: (cmd: string, val?: string) => void;
  onApplyFontSize: (size: string, cmdVal: string) => void;
  onApplyTextColor: (color: string) => void;
  onApplyHighlightColor: (color: string) => void;
  onInsertChecklistItem: () => void;
  onInsertList: (type: 'ul' | 'ol') => void;
  onIndent: () => void;
  onOutdent: () => void;
  onInsertTable: () => void;
  onInsertLink: () => void;
  onSelectAll: () => void;
  onCopySelection: () => void;
  onBackMobile?: () => void;
}
export const EditorToolbarMobile: React.FC<EditorToolbarMobileProps> = ({
  editorRef, currentFontSize, viewportState, activeMobileMenu, setActiveMobileMenu,
  copySuccess, onUndo, onRedo, onExecCmd, onApplyFontSize, onApplyTextColor,
  onApplyHighlightColor, onInsertChecklistItem, onInsertList, onIndent, onOutdent,
  onInsertTable, onInsertLink, onSelectAll, onCopySelection, onBackMobile,
}) => {
  const handleDone = () => {
    setActiveMobileMenu(null);
    const isKeypadOpen =
      (typeof window !== 'undefined' && viewportState && window.innerHeight - viewportState.height > 100) ||
      document.activeElement === editorRef.current ||
      (editorRef.current && editorRef.current.contains(document.activeElement));
    if (isKeypadOpen) {
      (document.activeElement as HTMLElement)?.blur();
    } else if (onBackMobile) {
      onBackMobile();
    }
  };
  return (
    <div className={styles.mobileBar}>
      <button type="button" onClick={onUndo} className={styles.mobileBarBtn} title="Undo">
        <BsArrowCounterclockwise size={16} />
      </button>
      <button type="button" onClick={onRedo} className={styles.mobileBarBtn} title="Redo">
        <BsArrowClockwise size={16} />
      </button>
      <div className={styles.relativeBox}>
        <button
          type="button"
          onClick={() => setActiveMobileMenu(activeMobileMenu === 'format' ? null : 'format')}
          className={`${styles.mobileBarBtn} ${styles.mobileFormatBtn} ${activeMobileMenu === 'format' ? styles.active : ''}`}
          title="Format & Font Size"
        >
          Aa
        </button>
        {activeMobileMenu === 'format' && (
          <EditorMobileFormatPopup
            currentFontSize={currentFontSize}
            onFormatBlock={(tag) => onExecCmd('formatBlock', tag)}
            onApplyFontSize={onApplyFontSize}
            onClose={() => setActiveMobileMenu(null)}
          />
        )}
      </div>
      <div className={styles.relativeBox}>
        <button
          type="button"
          onClick={() => setActiveMobileMenu(activeMobileMenu === 'palette' ? null : 'palette')}
          className={`${styles.mobileBarBtn} ${styles.primary} ${activeMobileMenu === 'palette' ? styles.active : ''}`}
          title="Color & Style"
        >
          <BsPalette size={16} />
        </button>
        {activeMobileMenu === 'palette' && (
          <EditorMobilePalettePopup
            onExecCmd={onExecCmd}
            onApplyTextColor={onApplyTextColor}
            onApplyHighlightColor={onApplyHighlightColor}
            onClose={() => setActiveMobileMenu(null)}
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => {
          setActiveMobileMenu(null);
          onInsertChecklistItem();
        }}
        className={`${styles.mobileBarBtn} ${styles.primary}`}
        title="Checklist"
      >
        <BsCardChecklist size={16} />
      </button>
      <EditorMobileExtraTools
        activeMobileMenu={activeMobileMenu}
        setActiveMobileMenu={setActiveMobileMenu}
        copySuccess={copySuccess}
        onInsertList={onInsertList}
        onIndent={onIndent}
        onOutdent={onOutdent}
        onInsertTable={onInsertTable}
        onInsertLink={onInsertLink}
        onExecCmd={onExecCmd}
        onSelectAll={onSelectAll}
        onCopySelection={onCopySelection}
      />
      {onBackMobile && (
        <button type="button" onClick={handleDone} className={styles.doneBtn}>
          Done
        </button>
      )}
    </div>
  );
};
