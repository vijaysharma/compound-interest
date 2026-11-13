import React, { RefObject, useState } from 'react';
import { FiBold, FiItalic, FiUnderline, FiSave, FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';
import {
  BsCardChecklist,
  BsPalette,
  BsTypeStrikethrough,
  BsHighlighter,
  BsArrowCounterclockwise,
  BsArrowClockwise,
  BsClipboard,
  BsClipboardCheck,
} from 'react-icons/bs';
import { MobileMenuType, ViewportState } from './types';
import { MobileButton } from './MobileButton';
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
  onApplyLineHeight: (lineHeight: string) => void;
  onApplyTextColor: (color: string) => void;
  onApplyHighlightColor: (color: string) => void;
  onApplyHighlighter: () => void;
  onInsertChecklistItem: () => void;
  onInsertList: (type: 'ul' | 'ol') => void;
  onIndent: () => void;
  onOutdent: () => void;
  onInsertTable: () => void;
  onInsertLink: () => void;
  onSelectAll: () => void;
  onCopySelection: () => void;
  onPasteRich: () => void;
  onPastePlain: () => void;
  isPlainPasteArmed?: boolean;
  onConfirmPlainPaste?: (text: string) => void;
  onCancelPlainPaste?: () => void;
  onBackMobile?: () => void;
  onManualSave?: () => void;
  isSaving?: boolean;
  isPendingSave?: boolean;
  saveSuccessMessage?: string | null;
  saveError?: string;
}
export const EditorToolbarMobile: React.FC<EditorToolbarMobileProps> = ({
  editorRef,
  currentFontSize,
  viewportState,
  activeMobileMenu,
  setActiveMobileMenu,
  copySuccess,
  onUndo,
  onRedo,
  onExecCmd,
  onApplyFontSize,
  onApplyLineHeight,
  onApplyTextColor,
  onApplyHighlightColor,
  onApplyHighlighter,
  onInsertChecklistItem,
  onInsertList,
  onIndent,
  onOutdent,
  onInsertTable,
  onInsertLink,
  onSelectAll,
  onCopySelection,
  onPasteRich,
  onPastePlain,
  isPlainPasteArmed,
  onConfirmPlainPaste,
  onCancelPlainPaste,
  onBackMobile,
  onManualSave,
  isSaving,
  isPendingSave,
  saveSuccessMessage,
  saveError,
}) => {
  const [fallbackText, setFallbackText] = useState('');
  const handleDone = () => {
    setActiveMobileMenu(null);
    const isKeypadOpen =
      (typeof window !== 'undefined' &&
        viewportState &&
        window.innerHeight - viewportState.height > 100) ||
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
      {/* Popups anchored above toolbar */}
      {activeMobileMenu === 'format' && (
        <EditorMobileFormatPopup
          currentFontSize={currentFontSize}
          onFormatBlock={(tag) => onExecCmd('formatBlock', tag)}
          onApplyFontSize={onApplyFontSize}
          onApplyLineHeight={onApplyLineHeight}
          onClose={() => setActiveMobileMenu(null)}
        />
      )}
      {activeMobileMenu === 'palette' && (
        <EditorMobilePalettePopup
          onExecCmd={onExecCmd}
          onApplyTextColor={onApplyTextColor}
          onApplyHighlightColor={onApplyHighlightColor}
          onClose={() => setActiveMobileMenu(null)}
        />
      )}
      {activeMobileMenu === 'paste' && !isPlainPasteArmed && (
        <div className={styles.mobilePlainPastePopup}>
          <div className={styles.mobilePlainPasteHeader}>
            <span className={styles.mobilePlainPasteTitle}>Paste Options</span>
            <button
              type="button"
              className={styles.mobilePlainPasteClose}
              onClick={() => setActiveMobileMenu(null)}
              aria-label="Close"
            >
              <FiX size={16} />
            </button>
          </div>
          <div className={styles.mobilePasteMenuBody}>
            <button
              type="button"
              className={styles.mobilePasteOptionBtn}
              onClick={() => {
                setActiveMobileMenu(null);
                onPasteRich();
              }}
            >
              <BsClipboard size={18} className={styles.iconMr025} />
              <div className={styles.dropdownItemCol}>
                <span className={styles.fw600}>Paste (with formatting)</span>
                <span className={styles.dropdownItemSub}>Keep styles, links, and bold text</span>
              </div>
            </button>
            <button
              type="button"
              className={styles.mobilePasteOptionBtn}
              onClick={() => {
                setActiveMobileMenu(null);
                onPastePlain();
              }}
            >
              <BsClipboardCheck size={18} className={styles.iconMr025} />
              <div className={styles.dropdownItemCol}>
                <span className={styles.fw600}>Paste as Plain Text</span>
                <span className={styles.dropdownItemSub}>Strip all formatting and tags</span>
              </div>
            </button>
          </div>
        </div>
      )}
      {isPlainPasteArmed && (
        <div className={styles.mobilePlainPastePopup}>
          <div className={styles.mobilePlainPasteHeader}>
            <span className={styles.mobilePlainPasteTitle}>Paste as Plain Text</span>
            <button
              type="button"
              className={styles.mobilePlainPasteClose}
              onClick={() => {
                setFallbackText('');
                onCancelPlainPaste?.();
              }}
              aria-label="Close"
            >
              <FiX size={16} />
            </button>
          </div>
          <p className={styles.mobilePlainPasteHelp}>
            Tap below and select Paste, or long-press in the editor to paste plain text:
          </p>
          <textarea
            className={styles.mobilePlainPasteTextarea}
            placeholder="Paste text here..."
            value={fallbackText}
            onChange={(e) => setFallbackText(e.target.value)}
            rows={2}
            autoFocus
          />
          <div className={styles.mobilePlainPasteActions}>
            <MobileButton
              action={() => {
                if (fallbackText) {
                  onConfirmPlainPaste?.(fallbackText);
                  setFallbackText('');
                } else {
                  onCancelPlainPaste?.();
                }
              }}
              className={styles.mobilePlainPasteSubmit}
              disabled={!fallbackText.trim()}
            >
              Insert Text
            </MobileButton>
            <MobileButton
              action={() => {
                setFallbackText('');
                onCancelPlainPaste?.();
              }}
              className={styles.mobilePlainPasteCancel}
            >
              Cancel
            </MobileButton>
          </div>
        </div>
      )}
      {/* Horizontally scrollable toolbar track */}
      <div className={styles.mobileBarScrollTrack}>
        {onManualSave && (
          <MobileButton
            action={onManualSave}
            disabled={isSaving}
            className={`${styles.mobileSaveBtn} ${
              saveError
                ? styles.saveError
                : isSaving
                  ? styles.saving
                  : isPendingSave
                    ? styles.hasUnsaved
                    : saveSuccessMessage
                      ? styles.savedSuccess
                      : ''
            }`}
            title={
              saveError
                ? `Save failed: ${saveError}`
                : isSaving
                  ? 'Saving note...'
                  : isPendingSave
                    ? 'Save note'
                    : saveSuccessMessage
                      ? 'Note saved'
                      : 'Save note'
            }
            aria-label="Save note"
          >
            {isSaving ? (
              <FiRefreshCw size={14} className={styles.spinning} />
            ) : saveSuccessMessage ? (
              <FiCheck size={14} />
            ) : (
              <FiSave size={14} />
            )}
            <span>{isSaving ? 'Saving' : saveSuccessMessage ? 'Saved' : 'Save'}</span>
          </MobileButton>
        )}
        <div className={styles.mobileBarScrollInner}>
          <MobileButton
            action={() => onExecCmd('bold')}
            className={styles.mobileBarBtn}
            title="Bold"
            aria-label="Bold"
          >
            <FiBold size={16} />
          </MobileButton>
          <MobileButton
            action={() => onExecCmd('italic')}
            className={styles.mobileBarBtn}
            title="Italic"
            aria-label="Italic"
          >
            <FiItalic size={16} />
          </MobileButton>
          <MobileButton
            action={() => onExecCmd('underline')}
            className={styles.mobileBarBtn}
            title="Underline"
            aria-label="Underline"
          >
            <FiUnderline size={16} />
          </MobileButton>
          <MobileButton
            action={() => onExecCmd('strikeThrough')}
            className={styles.mobileBarBtn}
            title="Strikethrough"
            aria-label="Strikethrough"
          >
            <BsTypeStrikethrough size={16} />
          </MobileButton>
          <div className={styles.toolbarDivider} />
          <MobileButton
            action={() => setActiveMobileMenu(activeMobileMenu === 'format' ? null : 'format')}
            className={`${styles.mobileBarBtn} ${styles.mobileFormatBtn} ${activeMobileMenu === 'format' ? styles.active : ''}`}
            title="Format, Font Size & Line Height"
            aria-label="Format, Font Size & Line Height"
          >
            Aa
          </MobileButton>
          <MobileButton
            action={() => setActiveMobileMenu(activeMobileMenu === 'palette' ? null : 'palette')}
            className={`${styles.mobileBarBtn} ${styles.primary} ${activeMobileMenu === 'palette' ? styles.active : ''}`}
            title="Color & Highlight"
            aria-label="Color & Highlight"
          >
            <BsPalette size={16} />
          </MobileButton>
          <MobileButton
            action={onApplyHighlighter}
            className={`${styles.mobileBarBtn} ${styles.primary}`}
            title="Highlighter"
            aria-label="Highlighter"
          >
            <BsHighlighter size={16} />
          </MobileButton>
          <MobileButton
            action={() => {
              setActiveMobileMenu(null);
              onInsertChecklistItem();
            }}
            className={`${styles.mobileBarBtn} ${styles.primary}`}
            title="Checklist"
            aria-label="Checklist"
          >
            <BsCardChecklist size={16} />
          </MobileButton>
          <MobileButton
            action={() => setActiveMobileMenu(activeMobileMenu === 'paste' ? null : 'paste')}
            className={`${styles.mobileBarBtn} ${activeMobileMenu === 'paste' || isPlainPasteArmed ? styles.active : ''}`}
            title="Paste options (Keep formatting or plain text)"
            aria-label="Paste options"
          >
            <BsClipboard size={16} />
          </MobileButton>
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
          <div className={styles.toolbarDivider} />
          <MobileButton
            action={onUndo}
            className={styles.mobileBarBtn}
            title="Undo"
            aria-label="Undo"
          >
            <BsArrowCounterclockwise size={16} />
          </MobileButton>
          <MobileButton
            action={onRedo}
            className={styles.mobileBarBtn}
            title="Redo"
            aria-label="Redo"
          >
            <BsArrowClockwise size={16} />
          </MobileButton>
        </div>
        {onBackMobile && (
          <MobileButton action={handleDone} className={styles.doneBtn} title="Done">
            Done
          </MobileButton>
        )}
      </div>
    </div>
  );
};
