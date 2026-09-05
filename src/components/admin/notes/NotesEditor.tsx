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
  const calculateStats = useCallback((text: string) => {
    const clean = text.replace(/<[^>]+>/g, ' ').trim();
    const chars = clean.replace(/\s+/g, '').length;
    const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
    setWordCount(words);
    setCharCount(chars);
  }, []);
  useEffect(() => {
    if (!note || !editorRef.current) return;
    if (editorRef.current.innerHTML !== (note.content || '')) {
      editorRef.current.innerHTML = note.content || '';
    }
    calculateStats((note.title || '') + ' ' + (note.content || ''));
  }, [note?.id, calculateStats, note?.content, note?.title, note]);
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
  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, value);
    handleContentChange();
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
          if (!content?.textContent?.trim()) {
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
          const circle = document.createElement('span');
          circle.className = 'qn-checkbox-circle';
          circle.setAttribute('contenteditable', 'false');
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
    <div className="flex-1 flex flex-col h-full bg-base-100/90 overflow-hidden relative qn-paper">
      <div className="border-b border-base-300/70 flex items-center justify-between gap-1 z-10 select-none min-h-[50px]">
        <div className="flex items-center gap-1 min-w-0">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="btn btn-ghost btn-sm px-1.5 flex items-center gap-0.5 text-primary md:hidden font-semibold min-h-[44px]"
            >
              <FiChevronLeft className="w-5 h-5" />
              <span className="truncate max-w-[100px]">{folderTitle || 'Notes'}</span>
            </button>
          )}
          {onToggleSidebar && !isMobileScreen && (
            <button
              onClick={onToggleSidebar}
              className={`btn btn-ghost btn-xs btn-square ${isSidebarOpen ? 'text-primary' : 'text-base-content/60'}`}
              title="Toggle Sidebar"
            >
              <FiMenu className="w-4 h-4" />
            </button>
          )}
          {!isTrash && (
            <div className="dropdown dropdown-bottom">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-xs gap-1 font-medium text-xs text-base-content/75 hover:text-base-content"
                title="Move to another folder"
              >
                <FiFolder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="truncate max-w-[90px] sm:max-w-[130px]">{currentFolder}</span>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-30 menu p-1.5 shadow-xl bg-base-100 rounded-box w-48 text-xs border border-base-200"
              >
                <li className="menu-title text-[10px] text-base-content/50">Move to Folder</li>
                {allFolderOptions.map((f) => (
                  <li key={f}>
                    <button
                      onClick={() => onUpdateNote({ folder: f })}
                      className={currentFolder === f ? 'active font-bold' : ''}
                    >
                      {f}
                    </button>
                  </li>
                ))}
                <li className="border-t border-base-200 mt-1 pt-1">
                  <button
                    onClick={() => setShowMoveModal(true)}
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
            <div className="dropdown dropdown-bottom">
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
                className="dropdown-content z-30 menu p-1 shadow-xl bg-base-100 rounded-box w-36 text-xs border border-base-200"
              >
                <li>
                  <button onClick={() => execCmd('formatBlock', '<h1>')} className="font-bold">
                    Title (H1)
                  </button>
                </li>
                <li>
                  <button onClick={() => execCmd('formatBlock', '<h2>')} className="font-semibold">
                    Heading (H2)
                  </button>
                </li>
                <li>
                  <button onClick={() => execCmd('formatBlock', '<h3>')} className="font-medium">
                    Subheading (H3)
                  </button>
                </li>
                <li>
                  <button onClick={() => execCmd('formatBlock', '<p>')}>Body Text</button>
                </li>
                <li>
                  <button onClick={() => execCmd('formatBlock', '<pre>')} className="font-mono">
                    Monospaced
                  </button>
                </li>
              </ul>
            </div>
            <div className="w-px h-4 bg-base-300 mx-0.5" />
            <button
              onClick={insertChecklistItem}
              className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
              title="Add Checklist Item (Cmd+Shift+L)"
            >
              <BsCardChecklist className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('bold')}
              className="btn btn-ghost btn-xs btn-square"
              title="Bold (Cmd+B)"
            >
              <FiBold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd('italic')}
              className="btn btn-ghost btn-xs btn-square"
              title="Italic (Cmd+I)"
            >
              <FiItalic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd('underline')}
              className="btn btn-ghost btn-xs btn-square"
              title="Underline (Cmd+U)"
            >
              <FiUnderline className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd('strikeThrough')}
              className="btn btn-ghost btn-xs btn-square"
              title="Strikethrough"
            >
              <BsTypeStrikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={applyHighlighter}
              className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
              title="Highlighter"
            >
              <BsHighlighter className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-base-300 mx-0.5" />
            <button
              onClick={() => execCmd('insertUnorderedList')}
              className="btn btn-ghost btn-xs btn-square"
              title="Bulleted List"
            >
              <BsListUl className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd('insertOrderedList')}
              className="btn btn-ghost btn-xs btn-square"
              title="Numbered List"
            >
              <BsListOl className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={insertTable}
              className="btn btn-ghost btn-xs btn-square"
              title="Insert Table"
            >
              <BsTable className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => execCmd('formatBlock', '<blockquote>')}
              className="btn btn-ghost btn-xs btn-square"
              title="Quote"
            >
              <BsQuote className="w-4 h-4" />
            </button>
            <button
              onClick={() => execCmd('formatBlock', '<pre>')}
              className="btn btn-ghost btn-xs btn-square"
              title="Code Block"
            >
              <FiCode className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={insertLink}
              className="btn btn-ghost btn-xs btn-square"
              title="Insert Link"
            >
              <FiLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 sm:gap-2">
          {onOpenSecurityModal && (
            <button
              onClick={onOpenSecurityModal}
              className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-success bg-success/10 hover:bg-success/20 border border-success/25 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              title="End-to-End Encrypted (AES-256-GCM): Click for details"
            >
              <FiShield className="w-3 h-3 flex-shrink-0" />
              <span className="hidden xs:inline">E2E</span> Encrypted
            </button>
          )}
          <span className="text-[11px] font-medium text-base-content/40 md:hidden mr-1">
            {isSaving ? 'Saving...' : 'Saved'}
          </span>
          {!isTrash && (
            <>
              <button
                onClick={onTogglePin}
                className={`btn btn-ghost btn-xs sm:btn-sm btn-square min-h-[38px] min-w-[38px] ${
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
                className={`btn btn-ghost btn-xs sm:btn-sm btn-square min-h-[38px] min-w-[38px] ${
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
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-xs sm:btn-sm btn-square text-base-content/75 hover:text-base-content min-h-[38px] min-w-[38px]"
              title="Share & Export"
            >
              <FiShare2 className="w-4 h-4" />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-30 menu p-2 shadow-xl bg-base-100 rounded-box w-52 text-xs border border-base-200"
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
                onClick={onPermanentDelete}
                className="btn btn-ghost btn-xs text-error min-h-[38px]"
                title="Delete Immediately"
              >
                <FiTrash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-ghost btn-xs sm:btn-sm btn-square text-base-content/60 hover:text-error min-h-[38px] min-w-[38px]"
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
          if (
            e.target === canvasContainerRef.current ||
            (e.target as HTMLElement).classList?.contains('qn-canvas-inner')
          ) {
            if (editorRef.current && !isTrash) {
              editorRef.current.focus();
              const sel = window.getSelection();
              if (sel) {
                const range = document.createRange();
                range.selectNodeContents(editorRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
              }
            }
          }
        }}
        className="flex-1 overflow-y-auto qn-scrollbar px-1 pt-4 sm:pt-6 md:pt-8 flex flex-col w-full h-full cursor-text"
      >
        <div className="qn-canvas-inner max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-full">
          <div className="flex items-center justify-between text-xs text-base-content/40 mb-3 sm:mb-4 select-none border-b border-base-200/60 pb-2 flex-shrink-0">
            <span className="text-[11px] font-medium">
              {formatNoteHeaderDate(note.updated_at || note.created_at)}
            </span>
            <div className="hidden sm:flex items-center gap-3 text-[11px]">
              {onOpenSecurityModal && (
                <button
                  type="button"
                  onClick={onOpenSecurityModal}
                  className="inline-flex items-center gap-1 text-[11px] text-success hover:underline font-medium cursor-pointer"
                  title="Zero-Knowledge AES-256-GCM End-to-End Encrypted: Click for details"
                >
                  <FiShield className="w-3.5 h-3.5" />
                  E2E Encrypted
                </button>
              )}
              <span>
                {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} characters
              </span>
              <span
                className={`font-medium ${
                  isSaving ? 'text-primary animate-pulse' : 'text-base-content/40'
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
            className="w-full text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-base-content placeholder-base-content/30 border-none outline-none bg-transparent mb-3 flex-shrink-0"
          />
          <div
            ref={editorRef}
            contentEditable={!isTrash}
            suppressContentEditableWarning
            onInput={handleContentChange}
            onClick={handleEditorClick}
            onKeyDown={handleKeyDown}
            className="flex-1 w-full qn-note-canvas outline-none text-base-content/90 text-base leading-relaxed cursor-text"
            data-placeholder="Start typing or tap the checklist button below..."
          />
          <div className="mt-auto pt-6 pb-6 border-t border-base-200/80 flex items-center flex-wrap gap-1.5 select-none flex-shrink-0">
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
        </div>
      </div>
      {!isTrash && isMobileScreen && (
        <div className="p-2 border-t border-base-300 bg-base-100/95 backdrop-blur-md flex items-center justify-between gap-1 select-none overflow-x-auto qn-scrollbar">
          <button
            onClick={insertChecklistItem}
            className="btn btn-ghost btn-sm btn-circle text-primary min-h-[42px] min-w-[42px]"
            title="Checklist"
          >
            <BsCardChecklist className="w-5 h-5" />
          </button>
          <div className="dropdown dropdown-top">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm font-bold text-sm min-h-[42px] px-2"
            >
              Aa
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content z-30 menu p-1.5 shadow-xl bg-base-100 rounded-box w-36 text-xs border border-base-200 mb-1"
            >
              <li>
                <button onClick={() => execCmd('formatBlock', '<h1>')} className="font-bold">
                  Title
                </button>
              </li>
              <li>
                <button onClick={() => execCmd('formatBlock', '<h2>')} className="font-semibold">
                  Heading
                </button>
              </li>
              <li>
                <button onClick={() => execCmd('formatBlock', '<h3>')} className="font-medium">
                  Subheading
                </button>
              </li>
              <li>
                <button onClick={() => execCmd('formatBlock', '<p>')}>Body</button>
              </li>
              <li>
                <button onClick={() => execCmd('formatBlock', '<pre>')} className="font-mono">
                  Code
                </button>
              </li>
            </ul>
          </div>
          <button
            onClick={() => execCmd('bold')}
            className="btn btn-ghost btn-sm btn-square min-h-[42px] min-w-[42px]"
            title="Bold"
          >
            <FiBold className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCmd('italic')}
            className="btn btn-ghost btn-sm btn-square min-h-[42px] min-w-[42px]"
            title="Italic"
          >
            <FiItalic className="w-4 h-4" />
          </button>
          <button
            onClick={applyHighlighter}
            className="btn btn-ghost btn-sm btn-square text-primary min-h-[42px] min-w-[42px]"
            title="Highlight"
          >
            <BsHighlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => execCmd('insertUnorderedList')}
            className="btn btn-ghost btn-sm btn-square min-h-[42px] min-w-[42px]"
            title="Bullets"
          >
            <BsListUl className="w-4 h-4" />
          </button>
          <button
            onClick={insertTable}
            className="btn btn-ghost btn-sm btn-square min-h-[42px] min-w-[42px]"
            title="Table"
          >
            <BsTable className="w-4 h-4" />
          </button>
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="btn btn-primary btn-sm px-3 ml-1 rounded-xl min-h-[38px] font-semibold"
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
              <FiTrash2 className="text-error w-5 h-5" /> Move to Trash
            </h3>
            <p className="text-xs text-base-content/70 mt-2">
              Are you sure you want to move <strong>"{note.title || 'Untitled Note'}"</strong> to Recently Deleted?
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
                  onDeleteNote();
                }}
                className="btn btn-error btn-sm text-xs text-white rounded-xl"
              >
                Move to Trash
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
