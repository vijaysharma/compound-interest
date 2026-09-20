import { RefObject, useCallback } from 'react';
import { isSafeUrl } from '../sanitizeHtml';
import { applyCollapsedFontSize, applySelectedFontSize } from './fontSizeUtils';
import { handleEditorIndent, handleEditorOutdent } from './editorIndentUtils';
interface UseEditorFormattingParams {
  editorRef: RefObject<HTMLDivElement | null>;
  noteId?: string;
  currentFontSize: string;
  setCurrentFontSize: (size: string) => void;
  saveSelection: () => void;
  restoreSelection: () => void;
  handleContentChange: (forceNewHistory?: boolean) => void;
}
export function useEditorFormatting({
  editorRef,
  noteId,
  currentFontSize,
  setCurrentFontSize,
  saveSelection,
  restoreSelection,
  handleContentChange,
}: UseEditorFormattingParams) {
  const execCmd = useCallback(
    (cmd: string, value: string | undefined = undefined) => {
      if (!editorRef.current) return;
      restoreSelection();
      document.execCommand(cmd, false, value);
      saveSelection();
      handleContentChange(true);
    },
    [editorRef, restoreSelection, saveSelection, handleContentChange]
  );
  const applyFontSize = useCallback(
    (sizePx: string, cmdVal: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      setCurrentFontSize(sizePx);
      if (noteId) {
        try { localStorage.setItem(`quick_notes_font_size_${noteId}`, sizePx); } catch { /* ignore */ }
      }
      try { localStorage.setItem('quick_notes_default_font_size', sizePx); } catch { /* ignore */ }
      editor.style.fontSize = sizePx;
      editor.style.setProperty('--qn-canvas-font-size', sizePx);
      restoreSelection();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) {
        editor.focus();
        handleContentChange();
        return;
      }
      const range = sel.getRangeAt(0);
      if (range.collapsed) {
        applyCollapsedFontSize(editor, range, sel, sizePx, currentFontSize);
      } else {
        applySelectedFontSize(editor, sel, sizePx, cmdVal);
      }
      saveSelection();
      handleContentChange();
    },
    [editorRef, noteId, currentFontSize, setCurrentFontSize, restoreSelection, saveSelection, handleContentChange]
  );
  const applyTextColor = useCallback(
    (color: string) => {
      if (!editorRef.current) return;
      restoreSelection();
      document.execCommand('foreColor', false, color === 'inherit' ? 'var(--color-base-content)' : color);
      saveSelection();
      handleContentChange();
    },
    [editorRef, restoreSelection, saveSelection, handleContentChange]
  );
  const applyHighlightColor = useCallback(
    (color: string) => {
      if (!editorRef.current) return;
      restoreSelection();
      if (color === 'transparent') {
        document.execCommand('removeFormat', false);
      } else if (!document.execCommand('hiliteColor', false, color)) {
        document.execCommand('backColor', false, color);
      }
      saveSelection();
      handleContentChange();
    },
    [editorRef, restoreSelection, saveSelection, handleContentChange]
  );
  const applyHighlighter = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
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
  }, [editorRef, handleContentChange]);
  const insertLink = useCallback(() => {
    const rawUrl = prompt('Enter URL:');
    if (!rawUrl) return;
    let url = rawUrl.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) && !url.startsWith('#') && !url.startsWith('/')) {
      url = `https://${url}`;
    }
    if (!isSafeUrl(url)) {
      alert('Invalid URL. Only http, https, mailto, and tel links are permitted.');
      return;
    }
    execCmd('createLink', url);
  }, [execCmd]);
  const handleIndent = useCallback(() => {
    handleEditorIndent(editorRef, execCmd, handleContentChange);
  }, [editorRef, execCmd, handleContentChange]);
  const handleOutdent = useCallback(() => {
    handleEditorOutdent(editorRef, execCmd, handleContentChange);
  }, [editorRef, execCmd, handleContentChange]);
  return {
    execCmd,
    applyFontSize,
    applyTextColor,
    applyHighlightColor,
    applyHighlighter,
    insertLink,
    handleIndent,
    handleOutdent,
  };
}
