export function toggleOffChecklistItem(
  checklistItem: HTMLElement, selection: Selection, onContentChange: () => void
): void {
  const contentEl = checklistItem.querySelector('.qn-checklist-content') as HTMLElement | null;
  let inner = contentEl ? contentEl.innerHTML : checklistItem.innerHTML;
  inner = inner.replace(/<span[^>]*class="[^"]*qn-checkbox-circle[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
  inner = inner.replace(/<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*>/gi, '');
  inner = inner.replace(/<\/div>/gi, '').trim();
  if (!inner || inner === '<br>') inner = '<br>';
  const p = document.createElement('p');
  p.innerHTML = inner;
  if (contentEl?.style.fontSize) {
    p.style.fontSize = contentEl.style.fontSize;
  }
  checklistItem.parentNode?.replaceChild(p, checklistItem);
  const r = document.createRange();
  if (inner === '<br>') {
    r.setStart(p, 0);
    r.collapse(true);
  } else {
    r.selectNodeContents(p);
    r.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(r);
  onContentChange();
}
export function convertListItemToChecklist(
  listItem: HTMLElement,
  selection: Selection,
  onContentChange: () => void
): void {
  const listParent = listItem.parentElement;
  let html = listItem.innerHTML.trim();
  if (!html || html === '<br>') {
    html = '<br>';
  }
  const checklistDiv = document.createElement('div');
  checklistDiv.className = 'qn-checklist-item';
  checklistDiv.setAttribute('data-checked', 'false');
  const checkboxSpan = document.createElement('span');
  checkboxSpan.className = 'qn-checkbox-circle';
  checkboxSpan.setAttribute('contenteditable', 'false');
  checkboxSpan.title = 'Mark as done';
  const contentDiv = document.createElement('div');
  contentDiv.className = 'qn-checklist-content';
  contentDiv.innerHTML = html;
  if (listItem.style.fontSize) {
    contentDiv.style.fontSize = listItem.style.fontSize;
  }
  checklistDiv.appendChild(checkboxSpan);
  checklistDiv.appendChild(contentDiv);
  if (listParent && listParent.children.length === 1) {
    listParent.parentNode?.replaceChild(checklistDiv, listParent);
  } else if (listParent) {
    const items = Array.from(listParent.children);
    const index = items.indexOf(listItem);
    if (index === 0) {
      listParent.parentNode?.insertBefore(checklistDiv, listParent);
      listItem.remove();
    } else if (index === items.length - 1) {
      listParent.after(checklistDiv);
      listItem.remove();
    } else {
      const afterItems = items.slice(index + 1);
      const secondList = document.createElement(listParent.tagName);
      afterItems.forEach((child) => secondList.appendChild(child));
      listItem.remove();
      listParent.after(checklistDiv);
      checklistDiv.after(secondList);
    }
  } else {
    listItem.parentNode?.replaceChild(checklistDiv, listItem);
  }
  const newRange = document.createRange();
  if (html !== '<br>') {
    newRange.selectNodeContents(contentDiv);
    newRange.collapse(false);
  } else {
    newRange.setStart(contentDiv, 0);
    newRange.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(newRange);
  onContentChange();
}
export function convertBlockToChecklist(
  range: Range,
  editorEl: HTMLElement,
  selection: Selection,
  onContentChange: () => void
): void {
  let block: HTMLElement | null = null;
  let curr: Node | null = range.startContainer;
  while (curr && curr !== editorEl) {
    if (curr instanceof HTMLElement && /^(P|DIV|H[1-6]|BLOCKQUOTE)$/i.test(curr.tagName)) {
      block = curr;
      break;
    }
    curr = curr.parentNode;
  }
  const checklistDiv = document.createElement('div');
  checklistDiv.className = 'qn-checklist-item';
  checklistDiv.setAttribute('data-checked', 'false');
  const checkboxSpan = document.createElement('span');
  checkboxSpan.className = 'qn-checkbox-circle';
  checkboxSpan.setAttribute('contenteditable', 'false');
  checkboxSpan.title = 'Mark as done';
  const contentDiv = document.createElement('div');
  contentDiv.className = 'qn-checklist-content';
  let initialHtml = '<br>';
  if (!range.collapsed) {
    initialHtml = range.toString() || '<br>';
  } else if (block && block !== editorEl) {
    const text = block.textContent?.trim();
    if (text) {
      initialHtml = block.innerHTML;
    }
  }
  contentDiv.innerHTML = initialHtml;
  if (block && block.style?.fontSize) {
    contentDiv.style.fontSize = block.style.fontSize;
  }
  checklistDiv.appendChild(checkboxSpan);
  checklistDiv.appendChild(contentDiv);
  if (block && block !== editorEl && (block.tagName === 'P' || block.tagName === 'DIV')) {
    block.parentNode?.replaceChild(checklistDiv, block);
  } else {
    range.deleteContents();
    range.insertNode(checklistDiv);
  }
  const newRange = document.createRange();
  if (initialHtml !== '<br>') {
    newRange.selectNodeContents(contentDiv);
    newRange.collapse(false);
  } else {
    newRange.setStart(contentDiv, 0);
    newRange.collapse(true);
  }
  selection.removeAllRanges();
  selection.addRange(newRange);
  onContentChange();
}
