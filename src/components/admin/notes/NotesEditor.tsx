'use client';
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
import { sanitizeNoteHtml, isSafeUrl, sanitizePlainInput } from './sanitizeHtml';
import styles from './NotesEditor.module.scss';
import modalStyles from './NotesModal.module.scss';
const FONT_SIZES = [
  { label: 'Small', size: '13px', cmdVal: '2' },
  { label: 'Normal', size: '16px', cmdVal: '3' },
  { label: 'Medium', size: '18px', cmdVal: '4' },
  { label: 'Large', size: '22px', cmdVal: '5' },
  { label: 'Huge', size: '28px', cmdVal: '6' },
];
function detectContentFontSize(html: string): string | null {
  if (!html) return null;
  const styleMatch = /style=["'][^"']*font-size:\s*(\d+px)[^"']*["']/i.exec(html);
  if (styleMatch) return styleMatch[1];
  const fontMatch = /<font[^>]*size=["'](\d)["']/i.exec(html);
  if (fontMatch) {
    const fs = FONT_SIZES.find((f) => f.cmdVal === fontMatch[1]);
    if (fs) return fs.size;
  }
  return null;
}
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
  const [viewportState, setViewportState] = useState<{ height: number; offsetTop: number } | null>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return {
        height: window.visualViewport.height,
        offsetTop: window.visualViewport.offsetTop,
      };
    }
    return null;
  });
  const [activeMobileMenu, setActiveMobileMenu] = useState<'format' | 'palette' | 'lists' | 'more' | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<'folder' | 'share' | 'format' | 'fontSize' | 'palette' | null>(null);
  useEffect(() => {
    if (!activeDropdown) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(`.${styles.dropdownContainer}`)) {
        return;
      }
      setActiveDropdown(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);
  const [currentFontSize, setCurrentFontSize] = useState<string>(() => {
    if (note?.id) {
      try {
        const saved = localStorage.getItem(`quick_notes_font_size_${note.id}`);
        if (saved) return saved;
      } catch {
        // ignore
      }
    }
    try {
      return localStorage.getItem('quick_notes_default_font_size') || '16px';
    } catch {
      return '16px';
    }
  });
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
    const isEditorEmpty =
      !editorRef.current.innerHTML ||
      editorRef.current.innerHTML === '<p><br></p>' ||
      editorRef.current.innerHTML === '<br>' ||
      editorRef.current.getAttribute('data-empty') === 'true';
    if (lastLoadedNoteIdRef.current !== note.id || (isEditorEmpty && note.content && note.content.trim())) {
      const rawHtml = note.content && note.content.trim() ? note.content : '<p><br></p>';
      const initialHtml = sanitizeNoteHtml(rawHtml);
      editorRef.current.innerHTML = initialHtml;
      const isBlank = !note.content || !note.content.trim() || initialHtml === '<p><br></p>';
      editorRef.current.setAttribute('data-empty', String(isBlank));
      lastLoadedNoteIdRef.current = note.id;
      const initialSize =
        (note.id ? localStorage.getItem(`quick_notes_font_size_${note.id}`) : null) ||
        detectContentFontSize(note.content || '') ||
        localStorage.getItem('quick_notes_default_font_size') ||
        '16px';
      editorRef.current.style.fontSize = initialSize;
      editorRef.current.style.setProperty('--qn-canvas-font-size', initialSize);
      setCurrentFontSize(initialSize);
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
        if (sel.isCollapsed) {
          let curr: Node | null = sel.anchorNode;
          if (curr && !(curr instanceof HTMLElement)) {
            curr = curr.parentElement;
          }
          let foundSize: string | null = null;
          while (curr && curr !== editorRef.current && curr instanceof HTMLElement) {
            if (curr.style.fontSize) {
              foundSize = curr.style.fontSize;
              break;
            }
            if (curr.tagName === 'FONT' && curr.getAttribute('size')) {
              const sz = curr.getAttribute('size');
              const match = FONT_SIZES.find((f) => f.cmdVal === sz);
              if (match) {
                foundSize = match.size;
                break;
              }
            }
            curr = curr.parentElement;
          }
          if (!foundSize && editorRef.current) {
            foundSize = editorRef.current.style.fontSize || '16px';
          }
          if (foundSize) {
            setCurrentFontSize((prev) => (prev !== foundSize ? foundSize : prev));
          }
        }
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportChange = () => {
      setViewportState({
        height: vv.height,
        offsetTop: vv.offsetTop,
      });
      if (editorRef.current && document.activeElement === editorRef.current) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && canvasContainerRef.current) {
            const containerRect = canvasContainerRef.current.getBoundingClientRect();
            if (rect.bottom > containerRect.bottom - 44) {
              canvasContainerRef.current.scrollTop += rect.bottom - containerRect.bottom + 60;
            }
          }
        }
      }
    };
    handleViewportChange();
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);
  const handleContentChange = () => {
    if (!editorRef.current || !note) return;
    const html = editorRef.current.innerHTML;
    const isBlank = !html || html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>';
    editorRef.current.setAttribute('data-empty', String(isBlank));
    calculateStats((note.title || '') + ' ' + html);
    const contentTags = extractHashtags((note.title || '') + ' ' + html);
    const combinedTags = Array.from(new Set([...(note.tags || []), ...contentTags]));
    onUpdateNote({ content: html, tags: combinedTags });
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    if (htmlData) {
      const cleanHtml = sanitizeNoteHtml(htmlData);
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (textData) {
      document.execCommand('insertText', false, textData);
    }
    handleContentChange();
  };
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;
    const newTitle = sanitizePlainInput(e.target.value, 250);
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
    setCurrentFontSize(sizePx);
    if (note?.id) {
      try {
        localStorage.setItem(`quick_notes_font_size_${note.id}`, sizePx);
      } catch {
        // ignore
      }
    }
    try {
      localStorage.setItem('quick_notes_default_font_size', sizePx);
    } catch {
      // ignore
    }
    editorRef.current.style.fontSize = sizePx;
    editorRef.current.style.setProperty('--qn-canvas-font-size', sizePx);
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current.contains(sel.anchorNode)) {
      editorRef.current.focus();
      handleContentChange();
      return;
    }
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      const block = (
        sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement
      )?.closest('p, div:not(.qn-note-canvas), li, .qn-checklist-content, h1, h2, h3, blockquote');
      if (block && editorRef.current.contains(block)) {
        (block as HTMLElement).style.fontSize = sizePx;
      }
      const topBlocks = editorRef.current.children;
      for (let i = 0; i < topBlocks.length; i++) {
        const child = topBlocks[i] as HTMLElement;
        if (child.classList.contains('qn-checklist-item')) {
          const content = child.querySelector('.qn-checklist-content') as HTMLElement | null;
          if (content && (!content.style.fontSize || content.style.fontSize === currentFontSize)) {
            content.style.fontSize = sizePx;
          }
        } else if (child.tagName === 'P' || child.tagName === 'DIV') {
          if (!child.style.fontSize || child.style.fontSize === currentFontSize) {
            child.style.fontSize = sizePx;
          }
        }
      }
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
      const anchorBlock = (
        sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement
      )?.closest('p, div:not(.qn-note-canvas), li, .qn-checklist-content');
      if (anchorBlock && editorRef.current.contains(anchorBlock)) {
        (anchorBlock as HTMLElement).style.fontSize = sizePx;
      }
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
    const rawUrl = prompt('Enter URL:');
    if (!rawUrl) return;
    const trimmed = rawUrl.trim();
    let url = trimmed;
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) && !url.startsWith('#') && !url.startsWith('/')) {
      url = `https://${url}`;
    }
    if (!isSafeUrl(url)) {
      alert('Invalid URL. Only http, https, mailto, and tel links are permitted.');
      return;
    }
    execCmd('createLink', url);
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
            if ((content as HTMLElement)?.style.fontSize) {
              p.style.fontSize = (content as HTMLElement).style.fontSize;
            }
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
          if ((content as HTMLElement)?.style.fontSize) {
            span.style.fontSize = (content as HTMLElement).style.fontSize;
          }
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
    const cleanTag = newTagInput.trim().replace(/^#+/, '').replace(/[^\w-]/g, '').slice(0, 30).toLowerCase();
    if (!cleanTag) return;
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
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIconBox}>
          <FiShield size={32} />
        </div>
        <h3 className={styles.emptyTitle}>End-to-End Encrypted Notes</h3>
        <p className={styles.emptyText}>
          All your notes are encrypted with AES-256-GCM right on your device before syncing. Only you have the key.
        </p>
        <div className={styles.emptyActions}>
          <button
            onClick={onNewNote}
            className={styles.btnPrimary}
          >
            <FiEdit3 size={16} />
            Create New Note
          </button>
          {onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className={`${styles.btnGhost} ${styles.success}`}
            >
              <FiShield size={14} />
              Security Info
            </button>
          )}
        </div>
      </div>
    );
  }
  if (note.is_locked && !isUnlockedInSession) {
    return (
      <div className={styles.lockedContainer}>
        <div className={styles.lockedTopBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onBackMobile && (
              <button
                onClick={onBackMobile}
                className={styles.backBtn}
              >
                <FiChevronLeft size={20} />
                <span>{folderTitle || 'Notes'}</span>
              </button>
            )}
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Locked Note</span>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={`${styles.iconBtn} ${styles.danger}`}
            title="Delete Note"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
        <div className={styles.lockedCenter}>
          <div className={styles.lockedIconBox}>
            <BsLockFill size={32} />
          </div>
          <h3 className={styles.emptyTitle} style={{ marginBottom: '0.25rem' }}>This note is locked</h3>
          <p className={styles.emptyText} style={{ marginBottom: '1.5rem' }}>
            Enter the password for this note to view its contents.
          </p>
          {unlockError && (
            <div className={styles.errorAlert}>
              <span>{unlockError}</span>
            </div>
          )}
          <form onSubmit={handleUnlockNote} style={{ width: '100%' }}>
            <input
              type="password"
              autoFocus
              placeholder="Enter password"
              value={unlockPassword}
              onChange={(e) => setUnlockPassword(e.target.value)}
              className={styles.lockedInput}
            />
            <button
              type="submit"
              disabled={!unlockPassword.trim()}
              className={styles.lockedSubmitBtn}
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
      className={`${styles.container} qn-paper`}
      style={
        isMobileScreen && viewportState
          ? {
              position: 'fixed',
              left: 0,
              right: 0,
              top: `${viewportState.offsetTop}px`,
              height: `${viewportState.height}px`,
              zIndex: 40,
            }
          : {
              height: '100%',
              maxHeight: '100%',
            }
      }
    >
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className={styles.backBtn}
            >
              <FiChevronLeft size={20} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>{folderTitle || 'Notes'}</span>
            </button>
          )}
          {onToggleSidebar && !isMobileScreen && (
            <button
              onClick={onToggleSidebar}
              className={`${styles.iconBtn} ${isSidebarOpen ? styles.active : ''}`}
              title="Toggle Sidebar"
            >
              <FiMenu size={16} />
            </button>
          )}
          {!isTrash && (
            <div className={styles.dropdownContainer}>
              <button
                type="button"
                onClick={() => {
                  setActiveMobileMenu(null);
                  setActiveDropdown(activeDropdown === 'folder' ? null : 'folder');
                }}
                className={`${styles.folderSelector} ${activeDropdown === 'folder' ? styles.active : ''}`}
                title="Move to another folder"
              >
                <FiFolder size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{currentFolder}</span>
              </button>
              {activeDropdown === 'folder' && (
                <ul
                  className={`${styles.dropdownMenu} ${styles.alignLeft}`}
                >
                  <li className={styles.dropdownTitle}>Move to Folder</li>
                  {allFolderOptions.map((f) => (
                    <li key={f}>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateNote({ folder: f });
                          setActiveDropdown(null);
                        }}
                        className={`${styles.dropdownItem} ${currentFolder === f ? styles.active : ''}`}
                      >
                        {f}
                      </button>
                    </li>
                  ))}
                  <li className={styles.dropdownDivider} />
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoveModal(true);
                        setActiveDropdown(null);
                      }}
                      className={styles.dropdownItem}
                      style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                    >
                      <FiFolderPlus size={14} />
                      Manage Folders...
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>
        <div className={styles.topBarRight}>
          {!isTrash && (
            <>
              <button
                onClick={onTogglePin}
                className={`${styles.iconBtn} ${
                  note.is_pinned ? styles.active : ''
                }`}
                title={note.is_pinned ? 'Unpin Note' : 'Pin Note'}
              >
                {note.is_pinned ? (
                  <BsPinFill size={16} />
                ) : (
                  <BsPin size={16} />
                )}
              </button>
              <button
                onClick={onOpenLockModal}
                className={`${styles.iconBtn} ${
                  note.is_locked ? styles.active : ''
                }`}
                title={note.is_locked ? 'Lock Settings' : 'Lock Note'}
              >
                {note.is_locked ? (
                  <FiLock size={16} />
                ) : (
                  <FiUnlock size={16} />
                )}
              </button>
            </>
          )}
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              onClick={() => {
                setActiveMobileMenu(null);
                setActiveDropdown(activeDropdown === 'share' ? null : 'share');
              }}
              className={`${styles.iconBtn} ${activeDropdown === 'share' ? styles.active : ''}`}
              title="Share & Export"
            >
              <FiShare2 size={16} />
            </button>
            {activeDropdown === 'share' && (
              <ul
                className={`${styles.dropdownMenu} ${styles.alignRight}`}
                style={{ width: '13rem' }}
              >
                {!isTrash && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoveModal(true);
                        setActiveDropdown(null);
                      }}
                      className={styles.dropdownItem}
                    >
                      <FiFolder size={14} color="var(--color-primary)" />
                      Move to Folder...
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleDumpToGoogleDrive();
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <SiGoogledrive size={14} color="#3b82f6" />
                    Save to Google Drive
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleDumpToOneDrive();
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <svg style={{ width: 14, height: 14, fill: '#0284c7' }} viewBox="0 0 24 24">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                    </svg>
                    Save to OneDrive
                  </button>
                </li>
                {onOpenBackupModal && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBackupModal();
                        setActiveDropdown(null);
                      }}
                      className={styles.dropdownItem}
                      style={{ color: 'var(--color-primary)', fontWeight: 600 }}
                    >
                      <BsCloudArrowUp size={14} />
                      Backup & Restore
                    </button>
                  </li>
                )}
                <li className={styles.dropdownDivider} />
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleCopy();
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiCopy size={14} />
                      Copy Content
                    </span>
                    {copySuccess && <FiCheck size={14} color="#16a34a" />}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportMarkdown();
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <FiDownload size={14} />
                    Download (.md)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportText();
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <FiDownload size={14} />
                    Download (.txt)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handlePrint();
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <FiPrinter size={14} />
                    Print / Save PDF
                  </button>
                </li>
                {!isTrash && (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onDuplicateNote();
                        setActiveDropdown(null);
                      }}
                      className={styles.dropdownItem}
                    >
                      <FiCopy size={14} />
                      Duplicate Note
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
          {isTrash ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={onRestoreNote}
                className={`${styles.btnGhost} ${styles.success}`}
                style={{ minHeight: '38px' }}
                title="Restore Note"
              >
                <FiRotateCcw size={16} style={{ marginRight: '0.25rem' }} />
                Put Back
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.btnGhost}
                style={{ color: '#ef4444', minHeight: '38px' }}
                title="Delete Permanently"
              >
                <FiTrash2 size={16} style={{ marginRight: '0.25rem' }} />
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`${styles.iconBtn} ${styles.danger}`}
              title="Move to Trash"
            >
              <FiTrash2 size={16} />
            </button>
          )}
          {!isTrash && !isMobileScreen && (
            <button
              onClick={onNewNote}
              className={styles.btnPrimary}
              style={{ padding: '0.35rem 0.6rem', borderRadius: '8px', marginLeft: '0.25rem' }}
              title="New Note (Cmd+N)"
            >
              <FiEdit3 size={14} />
            </button>
          )}
        </div>
      </div>
      {!isTrash && (
        <div className={styles.desktopToolbar}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleUndo}
            className={styles.toolbarBtn}
            title="Undo (Cmd+Z)"
          >
            <BsArrowCounterclockwise size={14} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleRedo}
            className={styles.toolbarBtn}
            title="Redo (Cmd+Shift+Z / Ctrl+Y)"
          >
            <BsArrowClockwise size={14} />
          </button>
          <div className={styles.toolbarDivider} />
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              onClick={() => {
                setActiveMobileMenu(null);
                setActiveDropdown(activeDropdown === 'format' ? null : 'format');
              }}
              className={`${styles.toolbarSelectBtn} ${activeDropdown === 'format' ? styles.active : ''}`}
              title="Heading style"
            >
              Format
            </button>
            {activeDropdown === 'format' && (
              <ul
                className={`${styles.dropdownMenu} ${styles.alignLeft}`}
                style={{ width: '9rem' }}
              >
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      execCmd('formatBlock', '<h1>');
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                    style={{ fontWeight: 700 }}
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
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                    style={{ fontWeight: 600 }}
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
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                    style={{ fontWeight: 500 }}
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
                      execCmd('formatBlock', '<pre>');
                      setActiveDropdown(null);
                    }}
                    className={styles.dropdownItem}
                    style={{ fontFamily: 'monospace' }}
                  >
                    Monospaced
                  </button>
                </li>
              </ul>
            )}
          </div>
          <div className={styles.dropdownContainer}>
            <button
              type="button"
              onClick={() => {
                setActiveMobileMenu(null);
                setActiveDropdown(activeDropdown === 'fontSize' ? null : 'fontSize');
              }}
              className={`${styles.toolbarSelectBtn} ${activeDropdown === 'fontSize' ? styles.active : ''}`}
              title={`Font size: ${FONT_SIZES.find((f) => f.size === currentFontSize)?.label || 'Normal'} (${currentFontSize})`}
            >
              <span>{FONT_SIZES.find((f) => f.size === currentFontSize)?.label || 'Size'}</span>
              <span style={{ fontSize: '9px', opacity: 0.6 }}>▼</span>
            </button>
            {activeDropdown === 'fontSize' && (
              <ul
                className={`${styles.dropdownMenu} ${styles.alignLeft}`}
                style={{ width: '9rem' }}
              >
                {FONT_SIZES.map((fs) => {
                  const isActive = currentFontSize === fs.size;
                  return (
                    <li key={fs.size}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          applyFontSize(fs.size, fs.cmdVal);
                          setActiveDropdown(null);
                        }}
                        className={`${styles.dropdownItem} ${isActive ? styles.active : ''}`}
                        style={{ fontSize: fs.size }}
                      >
                        <span>{fs.label}</span>
                        {isActive && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>✓</span>}
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
              onClick={() => {
                setActiveMobileMenu(null);
                setActiveDropdown(activeDropdown === 'palette' ? null : 'palette');
              }}
              className={`${styles.toolbarBtn} ${styles.primary} ${activeDropdown === 'palette' ? styles.active : ''}`}
              title="Color & Highlight"
            >
              <BsPalette size={14} />
            </button>
            {activeDropdown === 'palette' && (
              <div
                className={`${styles.dropdownMenu} ${styles.alignLeft}`}
                style={{ width: '14rem', padding: '0.65rem' }}
              >
                <div className={styles.dropdownTitle}>Text Color</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem', marginBottom: '0.65rem' }}>
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyTextColor(c.value);
                        setActiveDropdown(null);
                      }}
                      className={styles.colorSwatch}
                      style={{ backgroundColor: c.value === 'inherit' ? 'var(--color-heading, #333333)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className={styles.dropdownDivider} />
                <div className={styles.dropdownTitle}>Highlight Color</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyHighlightColor(c.value);
                        setActiveDropdown(null);
                      }}
                      className={styles.colorSwatch}
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
          <div className={styles.toolbarDivider} />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertChecklistItem}
            className={`${styles.toolbarBtn} ${styles.primary}`}
            title="Add Checklist Item (Cmd+Shift+L)"
          >
            <BsCardChecklist size={16} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('bold')}
            className={styles.toolbarBtn}
            title="Bold (Cmd+B)"
          >
            <FiBold size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('italic')}
            className={styles.toolbarBtn}
            title="Italic (Cmd+I)"
          >
            <FiItalic size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('underline')}
            className={styles.toolbarBtn}
            title="Underline (Cmd+U)"
          >
            <FiUnderline size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('strikeThrough')}
            className={styles.toolbarBtn}
            title="Strikethrough"
          >
            <BsTypeStrikethrough size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={applyHighlighter}
            className={`${styles.toolbarBtn} ${styles.primary}`}
            title="Highlighter"
          >
            <BsHighlighter size={14} />
          </button>
          <div className={styles.toolbarDivider} />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertUnorderedList')}
            className={styles.toolbarBtn}
            title="Bulleted List"
          >
            <BsListUl size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertOrderedList')}
            className={styles.toolbarBtn}
            title="Numbered List"
          >
            <BsListOl size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleOutdent}
            className={styles.toolbarBtn}
            title="Decrease Indent (Shift+Tab)"
          >
            <BsTextIndentLeft size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleIndent}
            className={styles.toolbarBtn}
            title="Increase Indent (Tab)"
          >
            <BsTextIndentRight size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertTable}
            className={styles.toolbarBtn}
            title="Insert Table"
          >
            <BsTable size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('formatBlock', '<blockquote>')}
            className={styles.toolbarBtn}
            title="Quote"
          >
            <BsQuote size={16} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('formatBlock', '<pre>')}
            className={styles.toolbarBtn}
            title="Code Block"
          >
            <FiCode size={14} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertLink}
            className={styles.toolbarBtn}
            title="Insert Link"
          >
            <FiLink size={14} />
          </button>
          <div className={styles.toolbarDivider} />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSelectAll}
            className={styles.toolbarBtn}
            title="Select All Content"
          >
            <BsCheck2All size={16} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopySelection}
            className={styles.toolbarBtn}
            title="Copy Selected Text"
          >
            {copySuccess ? (
              <FiCheck size={14} color="#16a34a" />
            ) : (
              <FiCopy size={14} />
            )}
          </button>
        </div>
      )}
      {isTrash && (
        <div className={styles.trashBanner}>
          <span>
            This note is in Recently Deleted. You cannot edit it unless you restore it.
          </span>
          <button
            onClick={onRestoreNote}
            className={styles.btnPrimary}
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            <FiRotateCcw size={12} style={{ marginRight: '0.25rem' }} />
            Restore Note
          </button>
        </div>
      )}
      {activeTable && !isTrash && (
        <div className={styles.tableToolsBar}>
          <span style={{ fontWeight: 600, opacity: 0.6, fontSize: '11px', whiteSpace: 'nowrap' }}>
            Table Tools:
          </span>
          <button
            onClick={addTableRow}
            className={styles.tableToolBtn}
          >
            + Add Row
          </button>
          <button
            onClick={addTableColumn}
            className={styles.tableToolBtn}
          >
            + Add Column
          </button>
          <button
            onClick={deleteTable}
            className={`${styles.tableToolBtn} ${styles.danger}`}
          >
            Delete Table
          </button>
          <button
            onClick={() => setActiveTable(null)}
            className={styles.toolbarBtn}
            style={{ marginLeft: 'auto' }}
          >
            <FiX size={14} />
          </button>
        </div>
      )}
      <div
        ref={canvasContainerRef}
        onClick={(e) => {
          if (activeMobileMenu) {
            setActiveMobileMenu(null);
          }
          if (activeDropdown) {
            setActiveDropdown(null);
          }
          const target = e.target as HTMLElement;
          if (
            target === canvasContainerRef.current ||
            target.classList.contains('qn-canvas-inner')
          ) {
            if (editorRef.current && !isTrash) {
              editorRef.current.focus();
              const sel = window.getSelection();
              if (sel && (sel.rangeCount === 0 || !editorRef.current.contains(sel.anchorNode))) {
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }
        }}
        className={`${styles.canvasContainer} qn-scrollbar`}
      >
        <div className={`${styles.canvasInner} qn-canvas-inner`}>
          <div className={styles.metaRow}>
            <span className={styles.metaDate}>
              {formatNoteHeaderDate(note.updated_at || note.created_at)}
            </span>
            <div className={styles.metaRight}>
              {onOpenSecurityModal && (
                <button
                  type="button"
                  onClick={onOpenSecurityModal}
                  className={styles.encryptedBadge}
                  title="Zero-Knowledge AES-256-GCM End-to-End Encrypted: Click for details"
                >
                  <FiShield size={12} style={{ flexShrink: 0 }} />
                  <span>E2E Encrypted</span>
                </button>
              )}
              <span>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} characters
              </span>
              <span
                style={{
                  fontWeight: 500,
                  fontSize: '11px',
                  color: isSaving ? 'var(--color-primary)' : 'var(--color-text)',
                  opacity: isSaving ? 1 : 0.5,
                }}
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
            maxLength={250}
            value={note.title || ''}
            onChange={handleTitleChange}
            className={styles.titleInput}
          />
          {/* Tags section placed under title to prevent obscuring editor canvas */}
          <div className={styles.tagsRow}>
            <FiTag size={14} style={{ color: 'var(--color-text)', opacity: 0.4, marginRight: '0.25rem' }} />
            {(note.tags || []).map((tag) => (
              <span
                key={tag}
                className={styles.tagChip}
              >
                #{tag}
                {!isTrash && (
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className={styles.tagRemoveBtn}
                    title="Remove tag"
                  >
                    <FiX size={10} />
                  </button>
                )}
              </span>
            ))}
            {!isTrash && (
              <>
                {isAddingTag ? (
                  <form onSubmit={handleAddTag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <input
                      type="text"
                      autoFocus
                      placeholder="tag name"
                      maxLength={30}
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className={styles.tagInput}
                      onKeyDown={(e) => e.key === 'Escape' && setIsAddingTag(false)}
                    />
                    <button type="submit" className={styles.tagRemoveBtn} style={{ color: '#16a34a' }}>
                      <FiCheck size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTag(false)}
                      className={styles.tagRemoveBtn}
                      style={{ color: '#ef4444' }}
                    >
                      <FiX size={12} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className={styles.tagAddBtn}
                  >
                    <FiPlus size={10} />
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
            onPaste={handlePaste}
            onInput={handleContentChange}
            onClick={handleEditorClick}
            onKeyDown={handleKeyDown}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            className={`${styles.editorCanvas} qn-note-canvas`}
            data-placeholder="Start typing or tap the checklist button below..."
          />
        </div>
      </div>
      {(activeMobileMenu || (isMobileScreen && activeDropdown)) && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => {
            setActiveMobileMenu(null);
            setActiveDropdown(null);
          }}
        />
      )}
      {!isTrash && (
        <div className={styles.mobileBar}>
          <button
            type="button"
            onClick={handleUndo}
            className={styles.mobileBarBtn}
            title="Undo"
          >
            <BsArrowCounterclockwise size={16} />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className={styles.mobileBarBtn}
            title="Redo"
          >
            <BsArrowClockwise size={16} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'format' ? null : 'format')}
              className={`${styles.mobileBarBtn} ${activeMobileMenu === 'format' ? styles.active : ''}`}
              style={{ fontWeight: 700, fontSize: '12px' }}
              title="Format & Font Size"
            >
              Aa
            </button>
            {activeMobileMenu === 'format' && (
              <ul className={`${styles.mobilePopup} ${styles.alignLeft}`}>
                <li className={styles.dropdownTitle}>Heading Style</li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<h1>');
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                    style={{ fontWeight: 700 }}
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
                    className={styles.dropdownItem}
                    style={{ fontWeight: 600 }}
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
                    className={styles.dropdownItem}
                    style={{ fontWeight: 500 }}
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
                    className={styles.dropdownItem}
                  >
                    Body Text
                  </button>
                </li>
                <li className={styles.dropdownDivider} />
                <li className={styles.dropdownTitle}>
                  Font Size
                </li>
                {FONT_SIZES.map((fs) => {
                  const isActive = currentFontSize === fs.size;
                  return (
                    <li key={fs.size}>
                      <button
                        type="button"
                        onClick={() => {
                          applyFontSize(fs.size, fs.cmdVal);
                          setActiveMobileMenu(null);
                        }}
                        className={`${styles.dropdownItem} ${isActive ? styles.active : ''}`}
                        style={{ fontSize: fs.size }}
                      >
                        <span>{fs.label}</span>
                        {isActive && <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>✓</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'palette' ? null : 'palette')}
              className={`${styles.mobileBarBtn} ${styles.primary} ${activeMobileMenu === 'palette' ? styles.active : ''}`}
              title="Color & Style"
            >
              <BsPalette size={16} />
            </button>
            {activeMobileMenu === 'palette' && (
              <div className={`${styles.mobilePopup} ${styles.alignLeft} ${styles.wide}`}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.375rem', marginBottom: '0.375rem', borderBottom: '1px solid var(--color-border)' }}>
                  <span className={styles.dropdownTitle} style={{ padding: 0 }}>Styles</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => execCmd('bold')}
                      className={styles.toolbarBtn}
                      title="Bold"
                    >
                      <FiBold size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('italic')}
                      className={styles.toolbarBtn}
                      title="Italic"
                    >
                      <FiItalic size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('underline')}
                      className={styles.toolbarBtn}
                      title="Underline"
                    >
                      <FiUnderline size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => execCmd('strikeThrough')}
                      className={styles.toolbarBtn}
                      title="Strikethrough"
                    >
                      <BsTypeStrikethrough size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles.dropdownTitle} style={{ padding: '0.2rem 0' }}>Text Color</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        applyTextColor(c.value);
                        setActiveMobileMenu(null);
                      }}
                      className={styles.colorSwatch}
                      style={{ backgroundColor: c.value === 'inherit' ? 'var(--color-heading, #333333)' : c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
                <div className={styles.dropdownDivider} />
                <div className={styles.dropdownTitle} style={{ padding: '0.2rem 0' }}>Highlight</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.375rem' }}>
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        applyHighlightColor(c.value);
                        setActiveMobileMenu(null);
                      }}
                      className={styles.colorSwatch}
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
            className={`${styles.mobileBarBtn} ${styles.primary}`}
            title="Checklist"
          >
            <BsCardChecklist size={16} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'lists' ? null : 'lists')}
              className={`${styles.mobileBarBtn} ${activeMobileMenu === 'lists' ? styles.active : ''}`}
              title="Lists & Indentation"
            >
              <BsListUl size={16} />
            </button>
            {activeMobileMenu === 'lists' && (
              <ul className={`${styles.mobilePopup} ${styles.alignLeft}`}>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('insertUnorderedList');
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsListUl size={14} /> Bulleted List
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('insertOrderedList');
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsListOl size={14} /> Numbered List
                  </button>
                </li>
                <li className={styles.dropdownDivider} />
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleIndent();
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsTextIndentRight size={14} /> Indent
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      handleOutdent();
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsTextIndentLeft size={14} /> Outdent
                  </button>
                </li>
              </ul>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setActiveMobileMenu(activeMobileMenu === 'more' ? null : 'more')}
              className={`${styles.mobileBarBtn} ${activeMobileMenu === 'more' ? styles.active : ''}`}
              title="More Tools"
            >
              <FiMoreHorizontal size={16} />
            </button>
            {activeMobileMenu === 'more' && (
              <ul className={`${styles.mobilePopup} ${styles.alignRight}`}>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileMenu(null);
                      insertTable();
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsTable size={14} /> Insert Table
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileMenu(null);
                      insertLink();
                    }}
                    className={styles.dropdownItem}
                  >
                    <FiLink size={14} /> Insert Link
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<blockquote>');
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsQuote size={14} /> Quote
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      execCmd('formatBlock', '<pre>');
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    <FiCode size={14} /> Code Block
                  </button>
                </li>
                <li className={styles.dropdownDivider} />
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMobileMenu(null);
                      handleSelectAll();
                    }}
                    className={styles.dropdownItem}
                  >
                    <BsCheck2All size={14} /> Select All
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCopySelection();
                      setActiveMobileMenu(null);
                    }}
                    className={styles.dropdownItem}
                  >
                    {copySuccess ? <FiCheck size={14} color="#16a34a" /> : <FiCopy size={14} />}
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
                const isKeypadOpen =
                  (typeof window !== 'undefined' &&
                    viewportState &&
                    window.innerHeight - viewportState.height > 100) ||
                  document.activeElement === editorRef.current ||
                  (editorRef.current && editorRef.current.contains(document.activeElement));
                if (isKeypadOpen) {
                  (document.activeElement as HTMLElement)?.blur();
                } else {
                  onBackMobile();
                }
              }}
              className={styles.doneBtn}
            >
              Done
            </button>
          )}
        </div>
      )}
      {showDeleteConfirm && (
        <div className={modalStyles.modalOverlay}>
          <div className={`${modalStyles.modalBox} ${modalStyles.modalBoxSm}`} style={{ padding: '1.25rem' }}>
            <h3 className={modalStyles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <FiTrash2 size={20} />
              {isTrash || note.is_trashed ? 'Permanently Delete Note' : 'Move to Trash'}
            </h3>
            <p className={modalStyles.helperText} style={{ marginTop: '0.5rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={modalStyles.btnGhost}
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
                className={modalStyles.btnPrimary}
                style={{ background: '#ef4444' }}
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
