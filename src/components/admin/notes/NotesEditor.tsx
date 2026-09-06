import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiLink,
  FiTrash2,
  FiRotateCcw,
  FiLock,
  FiUnlock,
  FiShare2,
  FiDownload,
  FiPrinter,
  FiCopy,
  FiCheck,
  FiPlus,
  FiX,
  FiTag,
  FiMenu,
  FiChevronLeft,
  FiFolder,
  FiFolderPlus,
  FiEdit3,
  FiShield,
  FiMoreHorizontal,
} from 'react-icons/fi';
import {
  BsPinFill,
  BsPin,
  BsTypeStrikethrough,
  BsQuote,
  BsCardChecklist,
  BsListOl,
  BsListUl,
  BsHighlighter,
  BsTable,
  BsLockFill,
  BsCloudArrowUp,
  BsTextIndentLeft,
  BsTextIndentRight,
  BsCheck2All,
  BsArrowCounterclockwise,
  BsArrowClockwise,
  BsPalette,
} from 'react-icons/bs';
import { SiGoogledrive } from 'react-icons/si';
import {
  Note,
  formatNoteHeaderDate,
  htmlToMarkdown,
  htmlToPlainText,
  extractHashtags,
  hashPasscode,
} from './NotesTypes';
import { MoveNoteModal } from './MoveNoteModal';
const FONT_SIZES = [
  { label: 'Small', size: '13px', cmdVal: '2' },
  { label: 'Normal', size: '16px', cmdVal: '3' },
  { label: 'Medium', size: '18px', cmdVal: '4' },
  { label: 'Large', size: '22px', cmdVal: '5' },
  { label: 'Huge', size: '28px', cmdVal: '6' },
];
const TEXT_COLORS = [
  { label: 'Default', value: 'inherit' },
  { label: 'Slate', value: '#475569' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Amber', value: '#d97706' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Teal', value: '#0d9488' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Purple', value: '#9333ea' },
  { label: 'Pink', value: '#db2777' },
];
const HIGHLIGHT_COLORS = [
  { label: 'None', value: 'transparent' },
  { label: 'Yellow', value: '#fef08a' },
  { label: 'Green', value: '#bbf7d0' },
  { label: 'Blue', value: '#bfdbfe' },
  { label: 'Purple', value: '#e9d5ff' },
  { label: 'Pink', value: '#fbcfe8' },
  { label: 'Orange', value: '#fed7aa' },
];
interface NotesEditorProps {
  note: Note | null;
  folders: string[];
  isSaving: boolean;
  onUpdateNote: (updated: Partial<Note>) => void;
  onTogglePin: () => void;
  onDeleteNote: () => void;
  onRestoreNote: () => void;
  onPermanentDelete: () => void;
  onNewNote: () => void;
  onOpenLockModal: () => void;
  onDuplicateNote: () => void;
  isUnlockedInSession: boolean;
  onUnlockSession: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onBackMobile?: () => void;
  onOpenBackupModal?: () => void;
  onOpenSecurityModal?: () => void;
  onCreateFolder?: (name: string) => void;
  folderTitle?: string;
  isMobileScreen?: boolean;
}
export const NotesEditor: React.FC<NotesEditorProps> = ({
  note,
  folders,
  isSaving,
  onUpdateNote,
  onTogglePin,
  onDeleteNote,
  onRestoreNote,
  onPermanentDelete,
  onNewNote,
  onOpenLockModal,
  onDuplicateNote,
  isUnlockedInSession,
  onUnlockSession,
  onToggleSidebar,
  isSidebarOpen,
  onBackMobile,
  onOpenBackupModal,
  onOpenSecurityModal,
  onCreateFolder,
  folderTitle,
  isMobileScreen,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [activeMobileMenu, setActiveMobileMenu] = useState<'format' | 'palette' | 'lists' | 'more' | null>(null);
  const calculateStats = useCallback((text: string) => {
    const clean = text.replace(/<[^>]+>/g, ' ').trim();
    const chars = clean.replace(/\s+/g, '').length;
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
    setCharCount(chars);
  }, []);
  const lastLoadedNoteIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!note || !editorRef.current) return;
    if (lastLoadedNoteIdRef.current !== note.id) {
      editorRef.current.innerHTML = note.content || '';
      lastLoadedNoteIdRef.current = note.id;
    }
    calculateStats((note.title || '') + ' ' + (note.content || ''));
  }, [note?.id, calculateStats, note?.title, note]);
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (
        sel &&
        sel.rangeCount > 0 &&
        editorRef.current &&
        editorRef.current.contains(sel.anchorNode)
      ) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
      if (editorRef.current && document.activeElement === editorRef.current) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && canvasContainerRef.current) {
            const containerRect = canvasContainerRef.current.getBoundingClientRect();
            if (rect.bottom > containerRect.bottom - 40) {
              canvasContainerRef.current.scrollTop += rect.bottom - containerRect.bottom + 60;
            }
          }
        }
      }
    };
    handleViewportChange();
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);
  const handleContentChange = () => {
    if (!editorRef.current || !note) return;
    const html = editorRef.current.innerHTML;
    calculateStats((note.title || '') + ' ' + html);
    const contentTags = extractHashtags((note.title || '') + ' ' + html);
    const combinedTags = Array.from(new Set([...(note.tags || []), ...contentTags]));
    onUpdateNote({ content: html, tags: combinedTags });
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;
    const newTitle = e.target.value;
    calculateStats(newTitle + ' ' + (note.content || ''));
    const contentTags = extractHashtags(newTitle + ' ' + (note.content || ''));
    const combinedTags = Array.from(new Set([...(note.tags || []), ...contentTags]));
    onUpdateNote({ title: newTitle, tags: combinedTags });
  };
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);
  const restoreSelection = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
    }
  }, []);
  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    restoreSelection();
    document.execCommand(cmd, false, value);
    saveSelection();
    handleContentChange();
  };
  const handleUndo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('undo', false);
    saveSelection();
    handleContentChange();
  };
  const handleRedo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand('redo', false);
    saveSelection();
    handleContentChange();
  };
  const applyFontSize = (sizePx: string, cmdVal: string) => {
    if (!editorRef.current) return;
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      const span = document.createElement('span');
      span.style.fontSize = sizePx;
      span.innerHTML = '&#8203;';
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(span.childNodes[0], 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      document.execCommand('fontSize', false, cmdVal);
      const fontEls = editorRef.current.querySelectorAll(`font[size="${cmdVal}"]`);
      fontEls.forEach((el) => {
        (el as HTMLElement).style.fontSize = sizePx;
      });
    }
    saveSelection();
    handleContentChange();
  };
  const applyTextColor = (color: string) => {
    if (!editorRef.current) return;
    restoreSelection();
    document.execCommand('foreColor', false, color === 'inherit' ? 'var(--color-base-content, #333333)' : color);
    saveSelection();
    handleContentChange();
  };
  const applyHighlightColor = (color: string) => {
    if (!editorRef.current) return;
    restoreSelection();
    if (color === 'transparent') {
      document.execCommand('removeFormat', false);
    } else {
      if (!document.execCommand('hiliteColor', false, color)) {
        document.execCommand('backColor', false, color);
      }
    }
    saveSelection();
    handleContentChange();
  };
  const handleIndent = () => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const checklistItem = (
      node instanceof HTMLElement ? node : node?.parentElement
    )?.closest('.qn-checklist-item') as HTMLElement | null;
    if (checklistItem) {
      const currentLevel = parseInt(checklistItem.getAttribute('data-level') || '0', 10);
      if (currentLevel < 4) {
        checklistItem.setAttribute('data-level', String(currentLevel + 1));
        handleContentChange();
      }
      return;
    }
    execCmd('indent');
  };
  const handleOutdent = () => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    const checklistItem = (
      node instanceof HTMLElement ? node : node?.parentElement
    )?.closest('.qn-checklist-item') as HTMLElement | null;
    if (checklistItem) {
      const currentLevel = parseInt(checklistItem.getAttribute('data-level') || '0', 10);
      if (currentLevel > 0) {
        if (currentLevel === 1) {
          checklistItem.removeAttribute('data-level');
        } else {
          checklistItem.setAttribute('data-level', String(currentLevel - 1));
        }
        handleContentChange();
      }
      return;
    }
    execCmd('outdent');
  };
  const handleSelectAll = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }
  };
  const handleCopySelection = async () => {
    const sel = window.getSelection();
    let textToCopy = '';
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      textToCopy = sel.toString();
    } else if (editorRef.current) {
      textToCopy = editorRef.current.innerText || '';
    }
    if (!textToCopy && note) {
      textToCopy = htmlToPlainText(note.title, note.content);
    }
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error(err);
      }
    }
  };
  const insertChecklistItem = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    const checklistDiv = document.createElement('div');
    checklistDiv.className = 'qn-checklist-item';
    checklistDiv.setAttribute('data-checked', 'false');
    const checkboxSpan = document.createElement('span');
    checkboxSpan.className = 'qn-checkbox-circle';
    checkboxSpan.setAttribute('contenteditable', 'false');
    checkboxSpan.title = 'Mark as done';
    const contentSpan = document.createElement('span');
    contentSpan.className = 'qn-checklist-content';
    contentSpan.innerHTML = range.toString() || '&nbsp;';
    checklistDiv.appendChild(checkboxSpan);
    checklistDiv.appendChild(contentSpan);
    range.deleteContents();
    range.insertNode(checklistDiv);
    const newRange = document.createRange();
    newRange.selectNodeContents(contentSpan);
    newRange.collapse(false);
    selection.removeAllRanges();
    selection.addRange(newRange);
    handleContentChange();
  };
  const insertTable = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const tableHtml = `
      <table class="qn-table">
        <thead>
          <tr>
            <th>Header 1</th>
            <th>Header 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Item 1</td>
            <td>Item 2</td>
          </tr>
          <tr>
            <td>Item 3</td>
            <td>Item 4</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    handleContentChange();
  };
  const addTableRow = () => {
    if (!activeTable) return;
    const tbody = activeTable.querySelector('tbody') || activeTable;
    const colCount = activeTable.rows[0]?.cells.length || 2;
    const newRow = tbody.insertRow();
    for (let i = 0; i < colCount; i++) {
      const cell = newRow.insertCell();
      cell.innerHTML = '&nbsp;';
    }
    handleContentChange();
  };
  const addTableColumn = () => {
    if (!activeTable) return;
    for (let i = 0; i < activeTable.rows.length; i++) {
      const row = activeTable.rows[i];
      if (row.parentElement?.tagName === 'THEAD') {
        const th = document.createElement('th');
        th.innerHTML = 'Header';
        row.appendChild(th);
      } else {
        const cell = row.insertCell();
        cell.innerHTML = '&nbsp;';
      }
    }
    handleContentChange();
  };
  const deleteTable = () => {
    if (!activeTable) return;
    activeTable.remove();
    setActiveTable(null);
    handleContentChange();
  };
  const applyHighlighter = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed) return;
    const mark = document.createElement('mark');
    mark.className = 'qn-highlight';
    try {
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
      handleContentChange();
    } catch {
      document.execCommand('hiliteColor', false, 'rgba(110, 11, 117, 0.2)');
      handleContentChange();
    }
  };
  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCmd('createLink', url);
    }
  };
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMobileMenu) {
      setActiveMobileMenu(null);
    }
    const target = e.target as HTMLElement;
    const checkbox = target.closest('.qn-checkbox-circle');
    if (checkbox) {
      e.preventDefault();
      e.stopPropagation();
      const item = checkbox.closest('.qn-checklist-item') as HTMLElement;
      if (item) {
        const currentChecked = item.getAttribute('data-checked') === 'true';
        const newChecked = !currentChecked;
        item.setAttribute('data-checked', String(newChecked));
        if (newChecked) {
          checkbox.classList.add('checked');
          checkbox.innerHTML = '✓';
        } else {
          checkbox.classList.remove('checked');
          checkbox.innerHTML = '';
        }
        handleContentChange();
      }
      return;
    }
    const table = target.closest('table') as HTMLTableElement | null;
    setActiveTable(table);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta) {
      if ((e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (((e.key === 'z' || e.key === 'Z') && e.shiftKey) || e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        execCmd('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        execCmd('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        execCmd('underline');
      } else if (e.shiftKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        insertChecklistItem();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleContentChange();
      }
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        handleOutdent();
      } else {
        handleIndent();
      }
      return;
    }
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.anchorNode;
        const currentItem = (
          node instanceof HTMLElement ? node : node?.parentElement
        )?.closest('.qn-checklist-item');
        if (currentItem) {
          e.preventDefault();
          const content = currentItem.querySelector('.qn-checklist-content');
          const currentLevel = parseInt(currentItem.getAttribute('data-level') || '0', 10);
          if (!content?.textContent?.trim()) {
            if (currentLevel > 0) {
              if (currentLevel === 1) {
                currentItem.removeAttribute('data-level');
              } else {
                currentItem.setAttribute('data-level', String(currentLevel - 1));
              }
              handleContentChange();
              return;
            }
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            currentItem.parentNode?.replaceChild(p, currentItem);
            const r = document.createRange();
            r.selectNodeContents(p);
            r.collapse(false);
            selection.removeAllRanges();
            selection.addRange(r);
            handleContentChange();
            return;
          }
          const newItem = document.createElement('div');
          newItem.className = 'qn-checklist-item';
          newItem.setAttribute('data-checked', 'false');
          if (currentLevel > 0) {
            newItem.setAttribute('data-level', String(currentLevel));
          }
          const circle = document.createElement('span');
          circle.className = 'qn-checkbox-circle';
          circle.setAttribute('contenteditable', 'false');
          circle.title = 'Mark as done';
          const span = document.createElement('span');
          span.className = 'qn-checklist-content';
          span.innerHTML = '<br>';
          newItem.appendChild(circle);
          newItem.appendChild(span);
          currentItem.after(newItem);
          const r = document.createRange();
          r.selectNodeContents(span);
          r.collapse(false);
          selection.removeAllRanges();
          selection.addRange(r);
          handleContentChange();
        }
      }
    }
  };
  const handleExportMarkdown = () => {
    if (!note) return;
    const md = htmlToMarkdown(note.title, note.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleExportText = () => {
    if (!note) return;
    const txt = htmlToPlainText(note.title, note.content);
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title || 'Note'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handlePrint = () => {
    window.print();
  };
  const handleCopy = async () => {
    if (!note) return;
    const text = htmlToPlainText(note.title, note.content);
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };
  const handleDumpToGoogleDrive = async () => {
    if (!note) return;
    const md = htmlToMarkdown(note.title, note.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const fileName = `${note.title || 'Note'}.md`;
    const file = new File([blob], fileName, { type: 'text/markdown' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: note.title || 'Note',
          text: 'Save note to Google Drive',
          files: [file],
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    handleExportMarkdown();
    window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
  };
  const handleDumpToOneDrive = async () => {
    if (!note) return;
    const md = htmlToMarkdown(note.title, note.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const fileName = `${note.title || 'Note'}.md`;
    const file = new File([blob], fileName, { type: 'text/markdown' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: note.title || 'Note',
          text: 'Save note to OneDrive',
          files: [file],
        });
        return;
      } catch (err: unknown) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    handleExportMarkdown();
    window.open('https://onedrive.live.com', '_blank', 'noopener,noreferrer');
  };
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !note) return;
    const cleanTag = newTagInput.trim().replace(/^#/, '').toLowerCase();
    const updated = Array.from(new Set([...(note.tags || []), cleanTag]));
    onUpdateNote({ tags: updated });
    setNewTagInput('');
    setIsAddingTag(false);
  };
  const handleRemoveTag = (tagToRemove: string) => {
    if (!note) return;
    const updated = (note.tags || []).filter((t) => t.toLowerCase() !== tagToRemove.toLowerCase());
    onUpdateNote({ tags: updated });
  };
  const handleUnlockNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword.trim() || !note) return;
    try {
      const hash = await hashPasscode(unlockPassword.trim());
      if (note.lock_password_hash && hash !== note.lock_password_hash) {
        setUnlockError('Incorrect password');
        return;
      }
      setUnlockPassword('');
      setUnlockError(null);
      onUnlockSession();
    } catch {
      setUnlockError('Verification failed');
    }
  };
  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-base-100/50 select-none">
        <div className="w-16 h-16 rounded-2xl bg-success/15 flex items-center justify-center text-success mb-4 shadow-xs">
          <FiShield className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg text-base-content mb-1">End-to-End Encrypted Notes</h3>
        <p className="text-xs text-base-content/60 max-w-sm mb-4 leading-relaxed">
          All your notes are encrypted with AES-256-GCM right on your device before syncing. Only you have the key.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewNote}
            className="btn btn-primary btn-sm font-semibold rounded-xl shadow-xs gap-1.5"
          >
            <FiEdit3 className="w-4 h-4" />
            Create New Note
          </button>
          {onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className="btn btn-ghost btn-sm text-success text-xs font-semibold rounded-xl"
            >
              <FiShield className="w-3.5 h-3.5" />
              Security Info
            </button>
          )}
        </div>
      </div>
    );
  }
  if (note.is_locked && !isUnlockedInSession) {
    return (
      <div className="flex-1 flex flex-col h-full bg-base-100">
        <div className="h-14 border-b border-base-200 px-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBackMobile && (
              <button
                onClick={onBackMobile}
                className="btn btn-ghost btn-sm flex items-center gap-0.5 text-primary font-semibold min-h-[44px]"
              >
                <FiChevronLeft className="w-5 h-5" />
                <span>{folderTitle || 'Notes'}</span>
              </button>
            )}
            <span className="font-bold text-sm">Locked Note</span>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn btn-ghost btn-sm text-error min-h-[44px] min-w-[44px]"
            title="Delete Note"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <BsLockFill className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg mb-1 text-base-content">This note is locked</h3>
          <p className="text-xs text-base-content/60 mb-6">
            Enter the password for this note to view its contents.
          </p>
          {unlockError && (
            <div className="alert alert-error text-xs py-2 px-3 mb-4 rounded-lg w-full">
              <span>{unlockError}</span>
            </div>
          )}
          <form onSubmit={handleUnlockNote} className="w-full space-y-3">
            <input
              type="password"
              autoFocus
              placeholder="Enter password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className="input input-bordered input-primary w-full rounded-xl text-center text-base min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!unlockPassword.trim()}
              className="btn btn-primary w-full rounded-xl font-semibold shadow-xs min-h-[44px]"
            >
              View Note
            </button>
          </form>
        </div>
      </div>
    );
  }
  const isTrash = Boolean(note.is_trashed);
  const currentFolder = note.folder || 'Quick Notes';
  const allFolderOptions = Array.from(new Set(['Quick Notes', ...folders]));
  return (
    <div
      className="flex-1 flex flex-col h-full bg-base-100/90 overflow-hidden relative qn-paper min-h-0"
      style={{
        height: viewportHeight && isMobileScreen ? `${viewportHeight - 48}px` : '100%',
        maxHeight: viewportHeight && isMobileScreen ? `${viewportHeight - 48}px` : '100%',
      }}
    >
      <div className="sticky top-0 bg-base-100/95 backdrop-blur-md border-b border-base-300/70 flex items-center justify-between gap-1 z-40 select-none min-h-[48px] px-2 sm:px-3 flex-shrink-0 overflow-visible">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="btn btn-ghost btn-sm px-1.5 flex items-center gap-0.5 text-primary md:hidden font-semibold min-h-[38px] flex-shrink-0"
            >
              <FiChevronLeft className="w-5 h-5" />
              <span className="truncate max-w-[80px] xs:max-w-[100px]">{folderTitle || 'Notes'}</span>
            </button>
          )}
          {onToggleSidebar && !isMobileScreen && (
            <button
              onClick={onToggleSidebar}
              className={`btn btn-ghost btn-xs btn-square ${isSidebarOpen ? 'text-primary' : 'text-base-content/60'} flex-shrink-0`}
              title="Toggle Sidebar"
            >
              <FiMenu className="w-4 h-4" />
            </button>
          )}
          {!isTrash && (
            <div className="dropdown dropdown-bottom min-w-0 relative">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs gap-1 font-medium text-xs text-base-content/75 hover:text-base-content max-w-full"
                title="Move to another folder"
              >
                <FiFolder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate max-w-[80px] xs:max-w-[110px] sm:max-w-[140px]">{currentFolder}</span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-50 menu p-1.5 shadow-2xl bg-base-100 rounded-box w-48 text-xs border border-base-200 mt-1"
              >
                <li className="menu-title text-[10px] text-base-content/50">Move to Folder</li>
                {allFolderOptions.map((f) => (
                  <li key={f}>
                    <button
                      onClick={() => {
                        onUpdateNote({ folder: f });
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      className={currentFolder === f ? 'active font-bold' : ''}
                    >
                      {f}
                    </button>
                  </li>
                ))}
                <li className="border-t border-base-200 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowMoveModal(true);
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="text-primary font-semibold flex items-center gap-1"
                  >
                    <FiFolderPlus className="w-3.5 h-3.5" />
                    Manage Folders...
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
        {!isTrash && (
          <div className="hidden md:flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleUndo}
              className="btn btn-ghost btn-xs btn-square"
              title="Undo (Cmd+Z)"
            >
              <BsArrowCounterclockwise className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleRedo}
              className="btn btn-ghost btn-xs btn-square"
              title="Redo (Cmd+Shift+Z / Ctrl+Y)"
            >
              <BsArrowClockwise className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-base-300 mx-0.5" />
            <div className="dropdown dropdown-bottom relative">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs text-xs font-semibold px-2"
                title="Heading style"
              >
                Format
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-50 menu p-1 shadow-2xl bg-base-100 rounded-box w-36 text-xs border border-base-200 mt-1"
              >
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('formatBlock', '<h1>');
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="font-bold"
                  >
                    Title (H1)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('formatBlock', '<h2>');
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="font-semibold"
                  >
                    Heading (H2)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('formatBlock', '<h3>');
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="font-medium"
                  >
                    Subheading (H3)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('formatBlock', '<p>');
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                  >
                    Body Text
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('formatBlock', '<pre>');
                      (document.activeElement as HTMLElement)?.blur();
                    }}
                    className="font-mono"
                  >
                    Monospaced
                  </button>
                </li>
              </ul>
            </div>
            <div className="dropdown dropdown-bottom relative">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs text-xs font-semibold px-2"
                title="Font size"
              >
                Size
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-50 menu p-1 shadow-2xl bg-base-100 rounded-box w-36 text-xs border border-base-200 mt-1"
              >
                {FONT_SIZES.map((fs) => (
                  <li key={fs.size}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyFontSize(fs.size, fs.cmdVal);
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      style={{ fontSize: fs.size }}
                    >
                      {fs.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="dropdown dropdown-bottom relative">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs btn-square text-primary"
                title="Color & Highlight"
              >
                <BsPalette className="w-3.5 h-3.5" />
              </div>
              <div
                tabIndex={0}
                className="dropdown-content z-50 p-2.5 shadow-2xl bg-base-100 rounded-box w-56 text-xs border border-base-200 mt-1"
              >
                <div className="text-[10px] font-bold text-base-content/50 uppercase mb-1.5">Text Color</div>
                <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyTextColor(c.value);
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      className="w-6 h-6 rounded-full border border-base-300 flex items-center justify-center hover:scale-110 transition-transform shadow-xs"
                      style={{ backgroundColor: c.value === 'inherit' ? 'var(--color-base-content, #333333)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-base-content/50 uppercase mb-1.5 border-t border-base-200 pt-1.5">Highlight Color</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyHighlightColor(c.value);
                        (document.activeElement as HTMLElement)?.blur();
                      }}
                      className="w-6 h-6 rounded-full border border-base-300 flex items-center justify-center hover:scale-110 transition-transform shadow-xs text-[10px] font-bold"
                      style={{ backgroundColor: c.value === 'transparent' ? 'transparent' : c.value }}
                      title={c.label}
                    >
                      {c.value === 'transparent' ? '✕' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-px h-4 bg-base-300 mx-0.5" />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertChecklistItem}
              className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
              title="Add Checklist Item (Cmd+Shift+L)"
            >
              <BsCardChecklist className="w-4 h-4" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('bold')}
              className="btn btn-ghost btn-xs btn-square"
              title="Bold (Cmd+B)"
            >
              <FiBold className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('italic')}
              className="btn btn-ghost btn-xs btn-square"
              title="Italic (Cmd+I)"
            >
              <FiItalic className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('underline')}
              className="btn btn-ghost btn-xs btn-square"
              title="Underline (Cmd+U)"
            >
              <FiUnderline className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('strikeThrough')}
              className="btn btn-ghost btn-xs btn-square"
              title="Strikethrough"
            >
              <BsTypeStrikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={applyHighlighter}
              className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
              title="Highlighter"
            >
              <BsHighlighter className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-base-300 mx-0.5" />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertUnorderedList')}
              className="btn btn-ghost btn-xs btn-square"
              title="Bulleted List"
            >
              <BsListUl className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertOrderedList')}
              className="btn btn-ghost btn-xs btn-square"
              title="Numbered List"
            >
              <BsListOl className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOutdent}
              className="btn btn-ghost btn-xs btn-square"
              title="Decrease Indent (Shift+Tab)"
            >
              <BsTextIndentLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleIndent}
              className="btn btn-ghost btn-xs btn-square"
              title="Increase Indent (Tab)"
            >
              <BsTextIndentRight className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertTable}
              className="btn btn-ghost btn-xs btn-square"
              title="Insert Table"
            >
              <BsTable className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('formatBlock', '<blockquote>')}
              className="btn btn-ghost btn-xs btn-square"
              title="Quote"
            >
              <BsQuote className="w-4 h-4" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('formatBlock', '<pre>')}
              className="btn btn-ghost btn-xs btn-square"
              title="Code Block"
            >
              <FiCode className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={insertLink}
              className="btn btn-ghost btn-xs btn-square"
              title="Insert Link"
            >
              <FiLink className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-base-300 mx-0.5" />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSelectAll}
              className="btn btn-ghost btn-xs btn-square"
              title="Select All Content"
            >
              <BsCheck2All className="w-4 h-4" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCopySelection}
              className="btn btn-ghost btn-xs btn-square"
              title="Copy Selected Text"
            >
              {copySuccess ? (
                <FiCheck className="w-3.5 h-3.5 text-success" />
              ) : (
                <FiCopy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
          {onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 hover:bg-success/20 border border-success/25 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              title="End-to-End Encrypted (AES-256-GCM): Click for details"
            >
              <FiShield className="w-3 h-3 flex-shrink-0" />
              <span>E2E Encrypted</span>
            </button>
          )}
          <span className="text-[11px] font-medium text-base-content/40 hidden md:inline mr-1">
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
          {!isTrash && (
            <>
              <button
                onClick={onTogglePin}
                className={`btn btn-ghost btn-xs sm:btn-sm btn-square min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex-shrink-0 ${
                  note.is_pinned ? 'text-primary' : 'text-base-content/60'
                }`}
                title={note.is_pinned ? 'Unpin Note' : 'Pin Note'}
              >
                {note.is_pinned ? (
                  <BsPinFill className="w-4 h-4" />
                ) : (
                  <BsPin className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={onOpenLockModal}
                className={`btn btn-ghost btn-xs sm:btn-sm btn-square min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex-shrink-0 ${
                  note.is_locked ? 'text-primary' : 'text-base-content/60'
                }`}
                title={note.is_locked ? 'Lock Settings' : 'Lock Note'}
              >
                {note.is_locked ? (
                  <FiLock className="w-4 h-4" />
                ) : (
                  <FiUnlock className="w-4 h-4" />
                )}
              </button>
            </>
          )}
          <div className="dropdown dropdown-end relative">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-xs sm:btn-sm btn-square text-base-content/75 hover:text-base-content min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex-shrink-0"
              title="Share & Export"
            >
              <FiShare2 className="w-4 h-4" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 rounded-box w-52 text-xs border border-base-200 mt-1"
            >
              {!isTrash && (
                <li>
                  <button onClick={() => setShowMoveModal(true)} className="flex items-center gap-2">
                    <FiFolder className="w-3.5 h-3.5 text-primary" />
                    Move to Folder...
                  </button>
                </li>
              )}
              <li>
                <button onClick={handleDumpToGoogleDrive} className="flex items-center gap-2">
                  <SiGoogledrive className="w-3.5 h-3.5 text-blue-500" />
                  Save to Google Drive
                </button>
              </li>
              <li>
                <button onClick={handleDumpToOneDrive} className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 fill-current text-sky-500" viewBox="0 0 24 24">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  </svg>
                  Save to OneDrive
                </button>
              </li>
              {onOpenBackupModal && (
                <li>
                  <button onClick={onOpenBackupModal} className="flex items-center gap-2 text-primary font-semibold">
                    <BsCloudArrowUp className="w-3.5 h-3.5" />
                    Backup & Restore
                  </button>
                </li>
              )}
              <div className="divider my-1"></div>
              <li>
                <button onClick={handleCopy} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FiCopy className="w-3.5 h-3.5" />
                    Copy Content
                  </span>
                  {copySuccess && <FiCheck className="w-3.5 h-3.5 text-success" />}
                </button>
              </li>
              <li>
                <button onClick={handleExportMarkdown} className="flex items-center gap-2">
                  <FiDownload className="w-3.5 h-3.5" />
                  Download (.md)
                </button>
              </li>
              <li>
                <button onClick={handleExportText} className="flex items-center gap-2">
                  <FiDownload className="w-3.5 h-3.5" />
                  Download (.txt)
                </button>
              </li>
              <li>
                <button onClick={handlePrint} className="flex items-center gap-2">
                  <FiPrinter className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
              </li>
              {!isTrash && (
                <li>
                  <button onClick={onDuplicateNote} className="flex items-center gap-2">
                    <FiCopy className="w-3.5 h-3.5" />
                    Duplicate Note
                  </button>
                </li>
              )}
            </ul>
          </div>
          {isTrash ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onRestoreNote}
                className="btn btn-ghost btn-xs text-success min-h-[38px]"
                title="Restore Note"
              >
                <FiRotateCcw className="w-4 h-4 mr-1" />
                Put Back
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="btn btn-ghost btn-xs text-error min-h-[38px]"
                title="Delete Permanently"
              >
                <FiTrash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-ghost btn-xs sm:btn-sm btn-square text-base-content/60 hover:text-error min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex-shrink-0"
              title="Move to Trash"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
          {!isTrash && !isMobileScreen && (
            <button
              onClick={onNewNote}
              className="btn btn-primary btn-xs rounded-lg font-semibold shadow-xs ml-1"
              title="New Note (Cmd+N)"
            >
              <FiEdit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {isTrash && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-primary font-medium">
            This note is in Recently Deleted. You cannot edit it unless you restore it.
          </span>
          <button
            onClick={onRestoreNote}
            className="btn btn-xs btn-primary font-semibold"
          >
            <FiRotateCcw className="w-3 h-3 mr-1" />
            Restore Note
          </button>
        </div>
      )}
      {activeTable && !isTrash && (
        <div className="bg-base-200/80 border-b border-base-300 px-4 py-1.5 flex items-center gap-2 text-xs select-none overflow-x-auto">
          <span className="font-semibold text-base-content/60 text-[11px] whitespace-nowrap">
            Table Tools:
          </span>
          <button
            onClick={addTableRow}
            className="btn btn-ghost btn-xs text-xs font-normal hover:bg-base-300 whitespace-nowrap min-h-[32px]"
          >
            + Add Row
          </button>
          <button
            onClick={addTableColumn}
            className="btn btn-ghost btn-xs text-xs font-normal hover:bg-base-300 whitespace-nowrap min-h-[32px]"
          >
            + Add Column
          </button>
          <button
            onClick={deleteTable}
            className="btn btn-ghost btn-xs text-xs font-normal text-error hover:bg-error/10 whitespace-nowrap min-h-[32px]"
          >
            Delete Table
          </button>
          <button
            onClick={() => setActiveTable(null)}
            className="btn btn-ghost btn-xs ml-auto text-base-content/50 min-h-[32px]"
          >
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div
        ref={canvasContainerRef}
        onClick={(e) => {
          if (activeMobileMenu) {
            setActiveMobileMenu(null);
          }
          if (e.target === canvasContainerRef.current) {
            const sel = window.getSelection();
            if (editorRef.current && !isTrash && (!sel || sel.isCollapsed)) {
              editorRef.current.focus();
            }
          }
        }}
        className="flex-1 overflow-y-auto qn-scrollbar px-3 sm:px-6 pt-3 sm:pt-6 pb-24 sm:pb-20 flex flex-col w-full min-h-0 cursor-text overscroll-contain"
      >
        <div className="qn-canvas-inner max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-full">
          <div className="flex items-center justify-between text-xs text-base-content/40 mb-3 sm:mb-4 select-none border-b border-base-200/60 pb-2 flex-shrink-0 gap-2">
            <span className="text-[11px] font-medium truncate">
              {formatNoteHeaderDate(note.updated_at || note.created_at)}
            </span>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] flex-shrink-0">
              {onOpenSecurityModal && (
                <button
                  type="button"
                  onClick={onOpenSecurityModal}
                  className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-success bg-success/10 hover:bg-success/20 border border-success/25 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Zero-Knowledge AES-256-GCM End-to-End Encrypted: Click for details"
                >
                  <FiShield className="w-3 h-3 flex-shrink-0" />
                  <span>E2E Encrypted</span>
                </button>
              )}
              <span className="hidden sm:inline">
                {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} characters
              </span>
              <span
                className={`font-medium text-[10px] sm:text-[11px] ${
                  isSaving ? 'text-primary animate-pulse' : 'text-base-content/50'
                }`}
              >
                {isSaving ? 'Saving...' : 'Saved'}
              </span>
            </div>
          </div>
          <input
            ref={titleInputRef}
            type="text"
            disabled={isTrash}
            placeholder="Title"
            value={note.title || ''}
            onChange={handleTitleChange}
            className="w-full text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-base-content placeholder-base-content/30 border-none outline-none bg-transparent mb-2 flex-shrink-0"
          />
          {/* Tags section placed under title to prevent obscuring editor canvas */}
          <div className="flex items-center flex-wrap gap-1.5 select-none mb-3 pb-2 border-b border-base-200/60 flex-shrink-0">
            <FiTag className="w-3.5 h-3.5 text-base-content/40 mr-1" />
            {(note.tags || []).map((tag) => (
              <span
                key={tag}
                className="badge badge-primary badge-outline badge-sm py-2 px-2.5 rounded-full text-xs font-medium flex items-center gap-1"
              >
                #{tag}
                {!isTrash && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-error transition-colors p-0.5"
                    title="Remove tag"
                  >
                    <FiX className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            ))}
            {!isTrash && (
              <>
                {isAddingTag ? (
                  <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      autoFocus
                      placeholder="tag name"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="input input-xs input-bordered input-primary rounded-full w-24 text-xs"
                      onKeyDown={(e) => e.key === 'Escape' && setIsAddingTag(false)}
                    />
                    <button type="submit" className="btn btn-ghost btn-xs px-1 text-success">
                      <FiCheck className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(false)}
                      className="btn btn-ghost btn-xs px-1 text-error"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="badge badge-sm py-2 px-2.5 rounded-full text-xs font-medium badge-ghost hover:bg-base-300 text-base-content/60 cursor-pointer flex items-center gap-1"
                  >
                    <FiPlus className="w-2.5 h-2.5" />
                    Add Tag
                  </button>
                )}
              </>
            )}
          </div>
          <div
            ref={editorRef}
            contentEditable={!isTrash}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleEditorClick}
            onKeyDown={handleKeyDown}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            className="flex-1 w-full qn-note-canvas outline-none text-base-content/90 text-base leading-relaxed cursor-text min-h-[160px] sm:min-h-[300px] select-text"
            data-placeholder="Start typing or tap the checklist button below..."
          />
        </div>
      </div>
      {activeMobileMenu && (
        <div
          className="md:hidden fixed inset-0 z-30"
          onClick={() => setActiveMobileMenu(null)}
        />
      )}
      {!isTrash && (
        <div className="md:hidden sticky bottom-0 z-40 px-2 py-1.5 border-t border-base-300 bg-base-100/95 backdrop-blur-md flex items-center justify-between select-none flex-shrink-0 w-full gap-1">
          <button
            type="button"
            onClick={handleUndo}
            className="btn btn-ghost btn-xs btn-square min-h-[34px] min-w-[34px]"
            title="Undo"
          >
            <BsArrowCounterclockwise className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="btn btn-ghost btn-xs btn-square min-h-[34px] min-w-[34px]"
            title="Redo"
          >
            <BsArrowClockwise className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'format' ? null : 'format')}
              className={`btn btn-ghost btn-xs font-bold text-xs min-h-[34px] min-w-[34px] px-1 ${activeMobileMenu === 'format' ? 'btn-active text-primary' : ''}`}
              title="Format & Font Size"
            >
              Aa
            </button>
            {activeMobileMenu === 'format' && (
              <ul className="absolute bottom-full mb-2 left-0 z-50 menu p-1.5 shadow-2xl bg-base-100 rounded-box w-44 text-xs border border-base-200">
                <li className="menu-title text-[10px] text-base-content/50 uppercase">Heading Style</li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<h1>');
                      setActiveMobileMenu(null);
                    }}
                    className="font-bold"
                  >
                    Title (H1)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<h2>');
                      setActiveMobileMenu(null);
                    }}
                    className="font-semibold"
                  >
                    Heading (H2)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<h3>');
                      setActiveMobileMenu(null);
                    }}
                    className="font-medium"
                  >
                    Subheading (H3)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<p>');
                      setActiveMobileMenu(null);
                    }}
                  >
                    Body Text
                  </button>
                </li>
                <li className="menu-title text-[10px] text-base-content/50 uppercase border-t border-base-200 mt-1 pt-1">
                  Font Size
                </li>
                {FONT_SIZES.map((fs) => (
                  <li key={fs.size}>
                    <button
                      type="button"
                      onClick={() => {
                        applyFontSize(fs.size, fs.cmdVal);
                        setActiveMobileMenu(null);
                      }}
                      style={{ fontSize: fs.size }}
                    >
                      {fs.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'palette' ? null : 'palette')}
              className={`btn btn-ghost btn-xs btn-square min-h-[34px] min-w-[34px] text-primary ${activeMobileMenu === 'palette' ? 'btn-active' : ''}`}
              title="Color & Style"
            >
              <BsPalette className="w-4 h-4" />
            </button>
            {activeMobileMenu === 'palette' && (
              <div className="absolute bottom-full mb-2 left-0 z-50 p-2 shadow-2xl bg-base-100 rounded-box w-56 text-xs border border-base-200">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-base-200">
                  <span className="text-[10px] font-bold text-base-content/50 uppercase">Styles</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        execCmd('bold');
                      }}
                      className="btn btn-ghost btn-xs btn-square min-h-[26px] min-w-[26px]"
                      title="Bold"
                    >
                      <FiBold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        execCmd('italic');
                      }}
                      className="btn btn-ghost btn-xs btn-square min-h-[26px] min-w-[26px]"
                      title="Italic"
                    >
                      <FiItalic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        execCmd('underline');
                      }}
                      className="btn btn-ghost btn-xs btn-square min-h-[26px] min-w-[26px]"
                      title="Underline"
                    >
                      <FiUnderline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        execCmd('strikeThrough');
                      }}
                      className="btn btn-ghost btn-xs btn-square min-h-[26px] min-w-[26px]"
                      title="Strikethrough"
                    >
                      <BsTypeStrikethrough className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-base-content/50 uppercase mb-1">Text Color</div>
                <div className="grid grid-cols-5 gap-1.5 mb-2">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        applyTextColor(c.value);
                        setActiveMobileMenu(null);
                      }}
                      className="w-6 h-6 rounded-full border border-base-300 flex items-center justify-center hover:scale-110 transition-transform shadow-xs"
                      style={{ backgroundColor: c.value === 'inherit' ? 'var(--color-base-content, #333333)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className="text-[10px] font-bold text-base-content/50 uppercase mb-1 border-t border-base-200 pt-1">
                  Highlight
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        applyHighlightColor(c.value);
                        setActiveMobileMenu(null);
                      }}
                      className="w-6 h-6 rounded-full border border-base-300 flex items-center justify-center hover:scale-110 transition-transform shadow-xs text-[10px] font-bold"
                      style={{ backgroundColor: c.value === 'transparent' ? 'transparent' : c.value }}
                      title={c.label}
                    >
                      {c.value === 'transparent' ? '✕' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveMobileMenu(null);
              insertChecklistItem();
            }}
            className="btn btn-ghost btn-xs btn-square min-h-[34px] min-w-[34px] text-primary"
            title="Checklist"
          >
            <BsCardChecklist className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'lists' ? null : 'lists')}
              className={`btn btn-ghost btn-xs btn-square min-h-[34px] min-w-[34px] ${activeMobileMenu === 'lists' ? 'btn-active text-primary' : ''}`}
              title="Lists & Indentation"
            >
              <BsListUl className="w-4 h-4" />
            </button>
            {activeMobileMenu === 'lists' && (
              <ul className="absolute bottom-full mb-2 left-0 z-50 menu p-1.5 shadow-2xl bg-base-100 rounded-box w-44 text-xs border border-base-200">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('insertUnorderedList');
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsListUl className="w-3.5 h-3.5" /> Bulleted List
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('insertOrderedList');
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsListOl className="w-3.5 h-3.5" /> Numbered List
                  </button>
                </li>
                <li className="border-t border-base-200 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleIndent();
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsTextIndentRight className="w-3.5 h-3.5" /> Indent
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleOutdent();
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsTextIndentLeft className="w-3.5 h-3.5" /> Outdent
                  </button>
                </li>
              </ul>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'more' ? null : 'more')}
              className={`btn btn-ghost btn-xs btn-square min-h-[34px] min-w-[34px] ${activeMobileMenu === 'more' ? 'btn-active text-primary' : ''}`}
              title="More Tools"
            >
              <FiMoreHorizontal className="w-4 h-4" />
            </button>
            {activeMobileMenu === 'more' && (
              <ul className="absolute bottom-full mb-2 right-0 z-50 menu p-1.5 shadow-2xl bg-base-100 rounded-box w-44 text-xs border border-base-200">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileMenu(null);
                      insertTable();
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsTable className="w-3.5 h-3.5" /> Insert Table
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileMenu(null);
                      insertLink();
                    }}
                    className="flex items-center gap-2"
                  >
                    <FiLink className="w-3.5 h-3.5" /> Insert Link
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<blockquote>');
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsQuote className="w-3.5 h-3.5" /> Quote
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<pre>');
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    <FiCode className="w-3.5 h-3.5" /> Code Block
                  </button>
                </li>
                <li className="border-t border-base-200 mt-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileMenu(null);
                      handleSelectAll();
                    }}
                    className="flex items-center gap-2"
                  >
                    <BsCheck2All className="w-3.5 h-3.5" /> Select All
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopySelection();
                      setActiveMobileMenu(null);
                    }}
                    className="flex items-center gap-2"
                  >
                    {copySuccess ? <FiCheck className="w-3.5 h-3.5 text-success" /> : <FiCopy className="w-3.5 h-3.5" />}
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                </li>
              </ul>
            )}
          </div>
          {onBackMobile && (
            <button
              type="button"
              onClick={() => {
                setActiveMobileMenu(null);
                onBackMobile();
              }}
              className="btn btn-primary btn-xs px-3 rounded-xl font-semibold min-h-[30px]"
            >
              Done
            </button>
          )}
        </div>
      )}
      {showDeleteConfirm && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-sm rounded-2xl bg-base-100 p-5 shadow-2xl border border-base-300">
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <FiTrash2 className="text-error w-5 h-5" />{' '}
              {isTrash || note.is_trashed ? 'Permanently Delete Note' : 'Move to Trash'}
            </h3>
            <p className="text-xs text-base-content/70 mt-2">
              {isTrash || note.is_trashed ? (
                <>
                  Are you sure you want to permanently delete{' '}
                  <strong>"{note.title || 'Untitled Note'}"</strong>? This will remove it completely
                  from the database and cloud storage. This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to move <strong>"{note.title || 'Untitled Note'}"</strong> to
                  Recently Deleted?
                </>
              )}
            </p>
            <div className="modal-action mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-ghost btn-sm text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (isTrash || note.is_trashed) {
                    onPermanentDelete();
                  } else {
                    onDeleteNote();
                  }
                }}
                className="btn btn-error btn-sm text-xs text-white rounded-xl"
              >
                {isTrash || note.is_trashed ? 'Delete Permanently' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
      <MoveNoteModal
        isOpen={showMoveModal}
        note={note}
        folders={folders}
        onClose={() => setShowMoveModal(false)}
        onMove={(_id, targetFolder) => onUpdateNote({ folder: targetFolder })}
        onCreateFolder={(name) => {
          if (onCreateFolder) onCreateFolder(name);
          onUpdateNote({ folder: name });
        }}
      />
    </div>
  );
};
