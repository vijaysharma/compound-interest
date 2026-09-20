import { useCallback } from 'react';
import { handleChecklistEnter } from './checklistEnterHandler';
interface UseEditorKeyboardParams {
  handleUndo: () => void;
  handleRedo: () => void;
  execCmd: (cmd: string, value?: string) => void;
  insertChecklistItem: () => void;
  handleIndent: () => void;
  handleOutdent: () => void;
  handleContentChange: (forceNewHistory?: boolean) => void;
}
export function useEditorKeyboard({
  handleUndo,
  handleRedo,
  execCmd,
  insertChecklistItem,
  handleIndent,
  handleOutdent,
  handleContentChange,
}: UseEditorKeyboardParams) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
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
      if (e.key === ' ' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
          const node = sel.anchorNode;
          if (node && node.nodeType === Node.TEXT_NODE && node.textContent) {
            const textBefore = node.textContent.substring(0, sel.anchorOffset).trim();
            if (textBefore === '[]' || textBefore === '- [ ]' || textBefore === '[ ]') {
              e.preventDefault();
              node.textContent = node.textContent.substring(sel.anchorOffset);
              insertChecklistItem();
              return;
            }
          }
        }
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
      if (e.key === 'Enter' && !e.shiftKey) {
        const selection = window.getSelection();
        if (selection && handleChecklistEnter(selection, () => handleContentChange(true))) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    },
    [
      handleUndo,
      handleRedo,
      execCmd,
      insertChecklistItem,
      handleIndent,
      handleOutdent,
      handleContentChange,
    ]
  );
  return { handleKeyDown };
}
