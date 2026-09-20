import React from 'react';
import { FiBold, FiItalic, FiUnderline, FiCode, FiLink, FiCopy, FiCheck } from 'react-icons/fi';
import {
  BsCardChecklist, BsTypeStrikethrough, BsHighlighter, BsListUl, BsListOl,
  BsTextIndentLeft, BsTextIndentRight, BsTable, BsQuote, BsCheck2All,
  BsArrowCounterclockwise, BsArrowClockwise,
} from 'react-icons/bs';
import { DropdownType } from './types';
import { EditorHeadingDropdown } from './EditorHeadingDropdown';
import { EditorFontAndColorDropdowns } from './EditorFontAndColorDropdowns';
import styles from '../NotesEditor.module.scss';
interface EditorToolbarDesktopProps {
  currentFontSize: string;
  activeDropdown: DropdownType;
  setActiveDropdown: (dropdown: DropdownType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExecCmd: (cmd: string, val?: string) => void;
  onApplyFontSize: (size: string, cmdVal: string) => void;
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
  copySuccess: boolean;
}
export const EditorToolbarDesktop: React.FC<EditorToolbarDesktopProps> = ({
  currentFontSize, activeDropdown, setActiveDropdown, onUndo, onRedo,
  onExecCmd, onApplyFontSize, onApplyTextColor, onApplyHighlightColor,
  onApplyHighlighter, onInsertChecklistItem, onInsertList, onIndent,
  onOutdent, onInsertTable, onInsertLink, onSelectAll, onCopySelection, copySuccess,
}) => {
  return (
    <div className={styles.desktopToolbar}>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onUndo} className={styles.toolbarBtn} title="Undo (Cmd+Z)">
        <BsArrowCounterclockwise size={14} />
      </button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onRedo} className={styles.toolbarBtn} title="Redo (Cmd+Shift+Z / Ctrl+Y)">
        <BsArrowClockwise size={14} />
      </button>
      <div className={styles.toolbarDivider} />
      <EditorHeadingDropdown activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} onFormatBlock={(tag) => onExecCmd('formatBlock', tag)} />
      <EditorFontAndColorDropdowns
        currentFontSize={currentFontSize}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        onApplyFontSize={onApplyFontSize}
        onApplyTextColor={onApplyTextColor}
        onApplyHighlightColor={onApplyHighlightColor}
      />
      <div className={styles.toolbarDivider} />
      <button onMouseDown={(e) => e.preventDefault()} onClick={onInsertChecklistItem} className={`${styles.toolbarBtn} ${styles.primary}`} title="Add Checklist Item (Cmd+Shift+L)">
        <BsCardChecklist size={16} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onExecCmd('bold')} className={styles.toolbarBtn} title="Bold (Cmd+B)">
        <FiBold size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onExecCmd('italic')} className={styles.toolbarBtn} title="Italic (Cmd+I)">
        <FiItalic size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onExecCmd('underline')} className={styles.toolbarBtn} title="Underline (Cmd+U)">
        <FiUnderline size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onExecCmd('strikeThrough')} className={styles.toolbarBtn} title="Strikethrough">
        <BsTypeStrikethrough size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onApplyHighlighter} className={`${styles.toolbarBtn} ${styles.primary}`} title="Highlighter">
        <BsHighlighter size={14} />
      </button>
      <div className={styles.toolbarDivider} />
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onInsertList('ul')} className={styles.toolbarBtn} title="Bulleted List">
        <BsListUl size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onInsertList('ol')} className={styles.toolbarBtn} title="Numbered List">
        <BsListOl size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onOutdent} className={styles.toolbarBtn} title="Decrease Indent (Shift+Tab)">
        <BsTextIndentLeft size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onIndent} className={styles.toolbarBtn} title="Increase Indent (Tab)">
        <BsTextIndentRight size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onInsertTable} className={styles.toolbarBtn} title="Insert Table">
        <BsTable size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onExecCmd('formatBlock', '<blockquote>')} className={styles.toolbarBtn} title="Quote">
        <BsQuote size={16} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => onExecCmd('formatBlock', '<pre>')} className={styles.toolbarBtn} title="Code Block">
        <FiCode size={14} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onInsertLink} className={styles.toolbarBtn} title="Insert Link">
        <FiLink size={14} />
      </button>
      <div className={styles.toolbarDivider} />
      <button onMouseDown={(e) => e.preventDefault()} onClick={onSelectAll} className={styles.toolbarBtn} title="Select All Content">
        <BsCheck2All size={16} />
      </button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onCopySelection} className={styles.toolbarBtn} title="Copy Selected Text">
        {copySuccess ? <FiCheck size={14} color="var(--color-success)" /> : <FiCopy size={14} />}
      </button>
    </div>
  );
};
