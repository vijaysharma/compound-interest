import { RefObject, useCallback } from 'react';
import {
  toggleOffChecklistItem,
  convertListItemToChecklist,
  convertBlockToChecklist,
} from './checklistUtils';
interface UseEditorChecklistParams {
  editorRef: RefObject<HTMLDivElement | null>;
  activeMobileMenu: string | null;
  setActiveMobileMenu: (menu: null) => void;
  setActiveTable: (table: HTMLTableElement | null) => void;
  handleContentChange: (forceNewHistory?: boolean) => void;
}
export function useEditorChecklist({
  editorRef,
  activeMobileMenu,
  setActiveMobileMenu,
  setActiveTable,
  handleContentChange,
}: UseEditorChecklistParams) {
  const insertChecklistItem = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    let checklistItem: HTMLElement | null = null;
    let n1: Node | null = range.startContainer;
    while (n1 && n1 !== editor) {
      if (n1 instanceof HTMLElement && n1.classList.contains('qn-checklist-item')) {
        checklistItem = n1;
        break;
      }
      n1 = n1.parentNode;
    }
    if (checklistItem) {
      toggleOffChecklistItem(checklistItem, selection, () => handleContentChange(true));
      return;
    }
    let listItem: HTMLElement | null = null;
    let n2: Node | null = range.startContainer;
    while (n2 && n2 !== editor) {
      if (n2 instanceof HTMLElement && n2.tagName === 'LI') {
        listItem = n2;
        break;
      }
      n2 = n2.parentNode;
    }
    if (listItem) {
      convertListItemToChecklist(listItem, selection, () => handleContentChange(true));
      return;
    }
    convertBlockToChecklist(range, editor, selection, () => handleContentChange(true));
  }, [editorRef, handleContentChange]);
  const handleEditorClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
        handleContentChange(true);
      }
      return;
    }
    const table = target.closest('table') as HTMLTableElement | null;
    setActiveTable(table);
  }, [activeMobileMenu, setActiveMobileMenu, setActiveTable, handleContentChange]);
  return { insertChecklistItem, handleEditorClick };
}
