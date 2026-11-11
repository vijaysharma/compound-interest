import { RefObject, useCallback } from 'react';
import { isSafeUrl } from '../sanitizeHtml';
import { applyCollapsedFontSize, applySelectedFontSize } from './fontSizeUtils';
import { applySelectedLineHeight, isRangeInEditor } from './lineHeightUtils';
import { handleEditorIndent, handleEditorOutdent } from './editorIndentUtils';
interface UseEditorFormattingParams {
  editorRef: RefObject<HTMLDivElement | null>;
  noteId?: string;
  currentFontSize: string;
  setCurrentFontSize: (size: string) => void;
  saveSelection: () => void;
  restoreSelection: () => void;
  handleContentChange: (forceNewHistory?: boolean) => void;
  savedRangeRef?: RefObject<Range | null>;
}
export function useEditorFormatting({
  editorRef,
  noteId,
  currentFontSize,
  setCurrentFontSize,
  saveSelection,
  restoreSelection,
  handleContentChange,
  savedRangeRef,
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
  const applyLineHeight = useCallback(
    (lineHeight: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      // 1. Capture live selection first
      const liveSel = typeof window !== 'undefined' ? window.getSelection() : null;
      let range: Range | null = liveSel && liveSel.rangeCount > 0 ? liveSel.getRangeAt(0) : null;

      // 2. Check if range is uncollapsed and both ends are inside editor
      const isLiveValidUncollapsed = Boolean(
        range &&
        !range.collapsed &&
        liveSel?.anchorNode &&
        editor.contains(liveSel.anchorNode) &&
        editor.contains(range.startContainer) &&
        editor.contains(range.endContainer) &&
        (range.startContainer as any).isConnected !== false &&
        (range.endContainer as any).isConnected !== false
      );

      // If range is null, collapsed, or outside editor:
      // Try to restore from savedRangeRef.current, BUT ONLY if it passes isRangeInEditor
      if (!isLiveValidUncollapsed) {
        if (savedRangeRef?.current && isRangeInEditor(savedRangeRef.current, editor)) {
          if (liveSel) {
            try {
              liveSel.removeAllRanges();
              const clone = savedRangeRef.current.cloneRange();
              liveSel.addRange(clone);
              range = clone;
            } catch {
              // ignore
            }
          }
        }
      }

      // If still null or outside editor, focus editor
      if (!range || !editor.contains(range.startContainer)) {
        editor.focus();
        const refreshedSel = typeof window !== 'undefined' ? window.getSelection() : null;
        range = refreshedSel && refreshedSel.rangeCount > 0 ? refreshedSel.getRangeAt(0) : null;
      }

      if (!liveSel || !range) return;

      const applied = applySelectedLineHeight(editor, liveSel, lineHeight, range);
      if (applied) {
        saveSelection();
        if (savedRangeRef && liveSel.rangeCount > 0) {
          try {
            savedRangeRef.current = liveSel.getRangeAt(0).cloneRange();
          } catch {
            // ignore
          }
        }
        handleContentChange(true);
      }
    },
    [editorRef, restoreSelection, saveSelection, handleContentChange, savedRangeRef]
  );
  return {
    execCmd,
    applyFontSize,
    applyLineHeight,
    applyTextColor,
    applyHighlightColor,
    applyHighlighter,
    insertLink,
    handleIndent,
    handleOutdent,
  };
}
