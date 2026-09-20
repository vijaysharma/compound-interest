import { RefObject } from 'react';
export function handleEditorIndent(
  editorRef: RefObject<HTMLDivElement | null>,
  execCmd: (cmd: string) => void,
  onContentChange: () => void
): void {
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
      onContentChange();
    }
    return;
  }
  execCmd('indent');
}
export function handleEditorOutdent(
  editorRef: RefObject<HTMLDivElement | null>,
  execCmd: (cmd: string) => void,
  onContentChange: () => void
): void {
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
      onContentChange();
    }
    return;
  }
  execCmd('outdent');
}
