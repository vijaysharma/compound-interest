import { RefObject, useRef, useCallback } from 'react';
interface UseEditorHistoryParams {
  editorRef: RefObject<HTMLDivElement | null>;
  saveSelection: () => void;
  handleContentChange: (forceNewHistory?: boolean) => void;
}
export function useEditorHistory({
  editorRef,
  saveSelection,
  handleContentChange,
}: UseEditorHistoryParams) {
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoRef = useRef<boolean>(false);
  const lastSnapshotTimeRef = useRef<number>(0);
  const pushSnapshot = useCallback((forceNew = false) => {
    if (!editorRef.current || isUndoRedoRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const now = Date.now();
    if (historyStackRef.current.length === 0) {
      historyStackRef.current = [currentHtml];
      historyIndexRef.current = 0;
      lastSnapshotTimeRef.current = now;
      return;
    }
    const lastHtml = historyStackRef.current[historyIndexRef.current];
    if (lastHtml === currentHtml) return;
    if (forceNew || now - lastSnapshotTimeRef.current > 800) {
      const nextStack = historyStackRef.current.slice(0, historyIndexRef.current + 1);
      nextStack.push(currentHtml);
      if (nextStack.length > 50) {
        nextStack.shift();
      }
      historyStackRef.current = nextStack;
      historyIndexRef.current = nextStack.length - 1;
      lastSnapshotTimeRef.current = now;
    } else {
      historyStackRef.current[historyIndexRef.current] = currentHtml;
    }
  }, [editorRef]);
  const handleUndo = useCallback(() => {
    if (!editorRef.current) return;
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const targetHtml = historyStackRef.current[historyIndexRef.current];
      isUndoRedoRef.current = true;
      editorRef.current.innerHTML = targetHtml;
      saveSelection();
      handleContentChange();
      isUndoRedoRef.current = false;
    }
  }, [editorRef, saveSelection, handleContentChange]);
  const handleRedo = useCallback(() => {
    if (!editorRef.current) return;
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current++;
      const targetHtml = historyStackRef.current[historyIndexRef.current];
      isUndoRedoRef.current = true;
      editorRef.current.innerHTML = targetHtml;
      saveSelection();
      handleContentChange();
      isUndoRedoRef.current = false;
    }
  }, [editorRef, saveSelection, handleContentChange]);
  return {
    historyStackRef,
    historyIndexRef,
    isUndoRedoRef,
    lastSnapshotTimeRef,
    pushSnapshot,
    handleUndo,
    handleRedo,
  };
}
