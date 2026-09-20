import { RefObject, useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { Note, deriveAutoTitleFromHtml, extractHashtags } from '../NotesTypes';
import { sanitizeNoteHtml } from '../sanitizeHtml';
import { detectContentFontSize } from './constants';
interface UseEditorContentParams {
  note: Note | null;
  editorRef: RefObject<HTMLDivElement | null>;
  historyStackRef: MutableRefObject<string[]>;
  historyIndexRef: MutableRefObject<number>;
  isUndoRedoRef: MutableRefObject<boolean>;
  lastSnapshotTimeRef: MutableRefObject<number>;
  pushSnapshot: (forceNew?: boolean) => void;
  schedulePropagation: (updates: Partial<Note>) => void;
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
}: UseEditorContentParams) {
  const hasManualTitleRef = useRef<boolean>(false);
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
    setWordCount(words);
    setCharCount(chars);
  }, []);
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
    const html = editorRef.current.innerHTML;
    const isBlank = !html || html === '<p><br></p>' || html === '<br>' || html === '<div><br></div>';
    editorRef.current.setAttribute('data-empty', String(isBlank));
    const isForceNew = typeof forceNewHistory === 'boolean' ? forceNewHistory : false;
    if (!isUndoRedoRef.current) {
      pushSnapshot(isForceNew);
    }
    let effectiveTitle = note.title;
    if (!hasManualTitleRef.current || !note.title || !note.title.trim()) {
      const derived = deriveAutoTitleFromHtml(html);
      if (derived) effectiveTitle = derived;
    }
    calculateStats((effectiveTitle || '') + ' ' + html);
    const contentTags = extractHashtags((effectiveTitle || '') + ' ' + html);
    const combinedTags = Array.from(new Set([...(note.tags || []), ...contentTags]));
    const updates: Partial<Note> = { content: html, tags: combinedTags };
    if (effectiveTitle !== note.title) {
      updates.title = effectiveTitle;
    }
    schedulePropagation(updates);
  }, [note, editorRef, isUndoRedoRef, pushSnapshot, calculateStats, schedulePropagation]);
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    if (htmlData) {
      const cleanHtml = sanitizeNoteHtml(htmlData);
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (textData) {
      if (textData.includes('\n')) {
        const lines = textData.split(/\r?\n/);
        const html = lines
          .map((line) => {
            const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<p>${escaped || '<br>'}</p>`;
          })
          .join('');
        document.execCommand('insertHTML', false, html);
      } else {
        document.execCommand('insertText', false, textData);
      }
    }
    handleContentChange(true);
  }, [handleContentChange]);
  return {
    wordCount,
    charCount,
    currentFontSize,
    setCurrentFontSize,
    hasManualTitleRef,
    calculateStats,
    handleContentChange,
    handlePaste,
  };
}
