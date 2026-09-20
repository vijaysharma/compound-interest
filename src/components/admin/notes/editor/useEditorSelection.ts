import { RefObject, useRef, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import { FONT_SIZES } from './constants';
interface UseEditorSelectionParams {
  editorRef: RefObject<HTMLDivElement | null>;
  setCurrentFontSize: Dispatch<SetStateAction<string>>;
}
export function useEditorSelection({
  editorRef,
  setCurrentFontSize,
}: UseEditorSelectionParams) {
  const savedRangeRef = useRef<Range | null>(null);
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, [editorRef]);
  const restoreSelection = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
      if (savedRangeRef.current) {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }
    }
  }, [editorRef]);
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      const editor = editorRef.current;
      if (sel && sel.rangeCount > 0 && editor && editor.contains(sel.anchorNode)) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        if (sel.isCollapsed) {
          let curr: Node | null = sel.anchorNode;
          if (curr && !(curr instanceof HTMLElement)) {
            curr = curr.parentElement;
          }
          let foundSize: string | null = null;
          while (curr && curr !== editor && curr instanceof HTMLElement) {
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
          if (!foundSize && editor) {
            foundSize = editor.style.fontSize || '16px';
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
  }, [editorRef, setCurrentFontSize]);
  const handleSelectAll = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      savedRangeRef.current = range.cloneRange();
    }
  }, [editorRef]);
  return { savedRangeRef, saveSelection, restoreSelection, handleSelectAll };
}
