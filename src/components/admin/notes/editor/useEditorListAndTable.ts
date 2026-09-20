import { RefObject, useState, useCallback } from 'react';
interface UseEditorListAndTableParams {
  editorRef: RefObject<HTMLDivElement | null>;
  execCmd: (cmd: string) => void;
  handleContentChange: (forceNewHistory?: boolean) => void;
}
export function useEditorListAndTable({
  editorRef,
  execCmd,
  handleContentChange,
}: UseEditorListAndTableParams) {
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const handleInsertList = useCallback(
    (type: 'ul' | 'ol') => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      let checklistItem: HTMLElement | null = null;
      let n: Node | null = range.startContainer;
      while (n && n !== editor) {
        if (n instanceof HTMLElement && n.classList.contains('qn-checklist-item')) {
          checklistItem = n;
          break;
        }
        n = n.parentNode;
      }
      if (checklistItem) {
        const contentEl = checklistItem.querySelector('.qn-checklist-content') as HTMLElement | null;
        let html = contentEl ? contentEl.innerHTML : checklistItem.innerHTML;
        html = html.replace(/<span[^>]*class="[^"]*qn-checkbox-circle[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
        html = html.replace(/<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*>/gi, '');
        html = html.replace(/<\/div>/gi, '').trim();
        if (!html || html === '<br>') html = '<br>';
        const li = document.createElement('li');
        li.innerHTML = html;
        if (contentEl?.style.fontSize) {
          li.style.fontSize = contentEl.style.fontSize;
        }
        const prev = checklistItem.previousElementSibling;
        const next = checklistItem.nextElementSibling;
        const tagName = type.toUpperCase();
        let targetList: HTMLElement;
        if (prev && prev.tagName === tagName) {
          prev.appendChild(li);
          targetList = prev as HTMLElement;
          checklistItem.remove();
          if (next && next.tagName === tagName) {
            while (next.firstChild) targetList.appendChild(next.firstChild);
            next.remove();
          }
        } else if (next && next.tagName === tagName) {
          next.insertBefore(li, next.firstChild);
          targetList = next as HTMLElement;
          checklistItem.remove();
        } else {
          targetList = document.createElement(type);
          targetList.appendChild(li);
          checklistItem.parentNode?.replaceChild(targetList, checklistItem);
        }
        const newRange = document.createRange();
        if (html !== '<br>') {
          newRange.selectNodeContents(li);
          newRange.collapse(false);
        } else {
          newRange.setStart(li, 0);
          newRange.collapse(true);
        }
        selection.removeAllRanges();
        selection.addRange(newRange);
        handleContentChange(true);
        return;
      }
      execCmd(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
    },
    [editorRef, execCmd, handleContentChange]
  );
  const insertTable = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const tableHtml = `
      <table class="qn-table">
        <thead><tr><th>Header 1</th><th>Header 2</th></tr></thead>
        <tbody><tr><td>Item 1</td><td>Item 2</td></tr><tr><td>Item 3</td><td>Item 4</td></tr></tbody>
      </table><p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    handleContentChange();
  }, [editorRef, handleContentChange]);
  const addTableRow = useCallback(() => {
    if (!activeTable) return;
    const tbody = activeTable.querySelector('tbody') || activeTable;
    const colCount = activeTable.rows[0]?.cells.length || 2;
    const newRow = tbody.insertRow();
    for (let i = 0; i < colCount; i++) {
      const cell = newRow.insertCell();
      cell.innerHTML = '&nbsp;';
    }
    handleContentChange();
  }, [activeTable, handleContentChange]);
  const addTableColumn = useCallback(() => {
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
  }, [activeTable, handleContentChange]);
  const deleteTable = useCallback(() => {
    if (!activeTable) return;
    activeTable.remove();
    setActiveTable(null);
    handleContentChange();
  }, [activeTable, handleContentChange]);
  return {
    activeTable,
    setActiveTable,
    handleInsertList,
    insertTable,
    addTableRow,
    addTableColumn,
    deleteTable,
  };
}
