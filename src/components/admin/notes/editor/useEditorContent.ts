import { RefObject, useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { Note } from '../NotesTypes';
import { sanitizeNoteHtml, scrubCanvasChildFocusables } from '../sanitizeHtml';
import { detectContentFontSize } from './constants';
import { stripHtmlToPlainText, formatPlainTextToHtml } from './plainTextPasteUtils';
interface UseEditorContentParams {
  note: Note | null;
  editorRef: RefObject<HTMLDivElement | null>;
  historyStackRef: MutableRefObject<string[]>;
  historyIndexRef: MutableRefObject<number>;
  isUndoRedoRef: MutableRefObject<boolean>;
  lastSnapshotTimeRef: MutableRefObject<number>;
  pushSnapshot: (forceNew?: boolean) => void;
  schedulePropagation: (updates: Partial<Note>) => void;
  onResetSaveStatus?: () => void;
  restoreSelection?: () => void;
}
export function useEditorContent({
  note,
  editorRef,
  historyStackRef,
  historyIndexRef,
  isUndoRedoRef,
  lastSnapshotTimeRef,
  pushSnapshot,
  schedulePropagation,
  onResetSaveStatus,
  restoreSelection,
}: UseEditorContentParams) {
  const hasManualTitleRef = useRef<boolean>(false);
  const [isPlainPasteArmed, setIsPlainPasteArmed] = useState<boolean>(false);
  const pasteAsPlainNextRef = useRef<boolean>(false);
  const setPlainPasteArmed = useCallback((armed: boolean) => {
    pasteAsPlainNextRef.current = armed;
    setIsPlainPasteArmed(armed);
  }, []);
  const lastLoadedNoteIdRef = useRef<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [currentFontSize, setCurrentFontSize] = useState<string>(() => {
    if (note?.id) {
      try {
        const saved = localStorage.getItem(`quick_notes_font_size_${note.id}`);
        if (saved) return saved;
      } catch { /* ignore */ }
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
    setWordCount((prev) => (prev === words ? prev : words));
    setCharCount((prev) => (prev === chars ? prev : chars));
  }, []);
  useEffect(() => {
    if (!note || !editorRef.current) return;
    const isEditorEmpty =
      !editorRef.current.innerHTML ||
      editorRef.current.innerHTML === '<p><br></p>' ||
      editorRef.current.innerHTML === '<br>' ||
      editorRef.current.getAttribute('data-empty') === 'true';
    const isFocused = typeof document !== 'undefined' && editorRef.current.contains(document.activeElement);
    if (lastLoadedNoteIdRef.current !== note.id || (!isFocused && isEditorEmpty && note.content && note.content.trim())) {
      const rawHtml = note.content && note.content.trim() ? note.content : '<p><br></p>';
      const initialHtml = sanitizeNoteHtml(rawHtml);
      editorRef.current.innerHTML = initialHtml;
      scrubCanvasChildFocusables(editorRef.current);
      const lhBlocks = editorRef.current.querySelectorAll<HTMLElement>('[data-line-height]');
      lhBlocks.forEach((b) => {
        const val = b.getAttribute('data-line-height');
        if (val && !b.style.lineHeight) {
          b.style.lineHeight = val;
        }
      });
      const isBlank = !note.content || !note.content.trim() || initialHtml === '<p><br></p>';
      editorRef.current.setAttribute('data-empty', String(isBlank));
      lastLoadedNoteIdRef.current = note.id;
      historyStackRef.current = [initialHtml];
      historyIndexRef.current = 0;
      lastSnapshotTimeRef.current = Date.now();
      hasManualTitleRef.current = Boolean(note.title && note.title.trim());
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
  }, [note?.id, calculateStats, note?.title, note, editorRef, historyStackRef, historyIndexRef, lastSnapshotTimeRef]);
  const handleContentChange = useCallback((forceNewHistory?: boolean | React.SyntheticEvent) => {
    if (!editorRef.current || !note) return;
    onResetSaveStatus?.();
    const html = editorRef.current.innerHTML;
    const isBlank = !html || html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>';
    editorRef.current.setAttribute('data-empty', String(isBlank));
    const isForceNew = typeof forceNewHistory === 'boolean' ? forceNewHistory : false;
    if (!isUndoRedoRef.current) {
      pushSnapshot(isForceNew);
    }
    calculateStats((note.title || '') + ' ' + html);
    const updates: Partial<Note> = { content: html };
    schedulePropagation(updates);
  }, [note, editorRef, isUndoRedoRef, pushSnapshot, calculateStats, schedulePropagation, onResetSaveStatus]);
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const isPlain = pasteAsPlainNextRef.current || (e.nativeEvent as unknown as KeyboardEvent)?.shiftKey;
    setPlainPasteArmed(false);
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    if (isPlain) {
      // Paste as plain text: strip all formatting and HTML tags
      const plain = textData || stripHtmlToPlainText(htmlData);
      if (plain) {
        if (plain.includes('\n')) {
          const html = formatPlainTextToHtml(plain);
          document.execCommand('insertHTML', false, html);
        } else {
          // Note: document.execCommand('insertText') is intentionally used despite MDN
          // deprecation because iOS Safari has no reliable modern replacement for this
          // restore-and-insert flow with rich contenteditable undo stacks.
          document.execCommand('insertText', false, plain);
        }
      }
    } else {
      // Default paste behavior unchanged
      if (htmlData) {
        const cleanHtml = sanitizeNoteHtml(htmlData);
        document.execCommand('insertHTML', false, cleanHtml);
      } else if (textData) {
        if (textData.includes('\n')) {
          const html = formatPlainTextToHtml(textData);
          document.execCommand('insertHTML', false, html);
        } else {
          document.execCommand('insertText', false, textData);
        }
      }
    }
    scrubCanvasChildFocusables(editorRef.current);
    handleContentChange(true);
  }, [editorRef, handleContentChange, setPlainPasteArmed]);
  const handlePastePlain = useCallback(async (customText?: string) => {
    if (customText !== undefined) {
      restoreSelection?.();
      editorRef.current?.focus();
      const plain = stripHtmlToPlainText(customText);
      if (plain) {
        if (plain.includes('\n')) {
          const html = formatPlainTextToHtml(plain);
          document.execCommand('insertHTML', false, html);
        } else {
          // Note: document.execCommand('insertText') is intentionally used despite MDN
          // deprecation because iOS Safari has no reliable modern replacement for this
          // restore-and-insert flow with rich contenteditable undo stacks.
          document.execCommand('insertText', false, plain);
        }
      }
      scrubCanvasChildFocusables(editorRef.current);
      handleContentChange(true);
      setPlainPasteArmed(false);
      return;
    }

    // Toggle off if already armed
    if (isPlainPasteArmed) {
      setPlainPasteArmed(false);
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setPlainPasteArmed(false);
          const editor = editorRef.current;
          if (editor) {
            editor.focus();
          }
          if (text.includes('\n')) {
            const html = formatPlainTextToHtml(text);
            document.execCommand('insertHTML', false, html);
          } else {
            document.execCommand('insertText', false, text);
          }
          scrubCanvasChildFocusables(editorRef.current);
          handleContentChange(true);
          return;
        }
      }
    } catch {
      // Permission denied or clipboard.readText unsupported without user gesture on iOS Safari
    }

    // Arm visible plain-paste toggle state on iOS Safari (stays armed until tapped off or paste occurs)
    setPlainPasteArmed(true);
    editorRef.current?.focus();
  }, [editorRef, handleContentChange, isPlainPasteArmed, restoreSelection, setPlainPasteArmed]);
  const handlePasteRich = useCallback(async () => {
    restoreSelection?.();
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
    }
    setPlainPasteArmed(false);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            if (html) {
              const cleanHtml = sanitizeNoteHtml(html);
              document.execCommand('insertHTML', false, cleanHtml);
              scrubCanvasChildFocusables(editorRef.current);
              handleContentChange(true);
              return;
            }
          }
        }
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (text.includes('\n')) {
            const html = formatPlainTextToHtml(text);
            document.execCommand('insertHTML', false, html);
          } else {
            document.execCommand('insertText', false, text);
          }
          scrubCanvasChildFocusables(editorRef.current);
          handleContentChange(true);
          return;
        }
      }
    } catch {
      // Clipboard permission denied, insecure context, or browser security blocks read (e.g. Firefox)
    }
    if (typeof alert === 'function') {
      alert('Clipboard permission denied or unavailable — please use Cmd+V (or Ctrl+V) to paste with formatting.');
    }
  }, [editorRef, handleContentChange, restoreSelection, setPlainPasteArmed]);
  return {
    wordCount,
    charCount,
    currentFontSize,
    setCurrentFontSize,
    hasManualTitleRef,
    pasteAsPlainNextRef,
    isPlainPasteArmed,
    togglePlainPasteArmed: setPlainPasteArmed,
    calculateStats,
    handleContentChange,
    handlePaste,
    handlePastePlain,
    handlePasteRich,
  };
}
