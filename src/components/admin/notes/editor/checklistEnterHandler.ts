export function handleChecklistEnter(
  selection: Selection,
  onContentChange: () => void
): boolean {
  if (selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  const node: Node | null = range.startContainer;
  let currentItem: HTMLElement | null = null;
  if (node instanceof HTMLElement) {
    currentItem = node.closest('.qn-checklist-item');
  } else if (node?.parentElement) {
    currentItem = node.parentElement.closest('.qn-checklist-item');
  }
  if (!currentItem) return false;
  const contentEl = currentItem.querySelector('.qn-checklist-content') as HTMLElement | null;
  const currentLevel = parseInt(currentItem.getAttribute('data-level') || '0', 10);
  const rawText = contentEl?.textContent?.replace(/\u200B/g, '').trim() || '';
  if (!rawText && (!contentEl || !contentEl.querySelector('img, a, table'))) {
    if (currentLevel > 0) {
      if (currentLevel === 1) {
        currentItem.removeAttribute('data-level');
      } else {
        currentItem.setAttribute('data-level', String(currentLevel - 1));
      }
      onContentChange();
      return true;
    }
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    if (contentEl?.style.fontSize) {
      p.style.fontSize = contentEl.style.fontSize;
    }
    currentItem.parentNode?.replaceChild(p, currentItem);
    const r = document.createRange();
    r.setStart(p, 0);
    r.collapse(true);
    selection.removeAllRanges();
    selection.addRange(r);
    onContentChange();
    return true;
  }
  const afterRange = document.createRange();
  if (contentEl && contentEl.contains(range.startContainer)) {
    afterRange.setStart(range.startContainer, range.startOffset);
    afterRange.setEndAfter(contentEl.lastChild || contentEl);
  }
  const afterFrag = afterRange.extractContents();
  if (contentEl && (!contentEl.innerHTML || !contentEl.textContent?.trim())) {
    contentEl.innerHTML = '<br>';
  }
  const newItem = document.createElement('div');
  newItem.className = 'qn-checklist-item';
  newItem.setAttribute('data-checked', 'false');
  if (currentLevel > 0) {
    newItem.setAttribute('data-level', String(currentLevel));
  }
  const circle = document.createElement('span');
  circle.className = 'qn-checkbox-circle';
  circle.setAttribute('contenteditable', 'false');
  circle.title = 'Mark as done';
  const newContent = document.createElement('div');
  newContent.className = 'qn-checklist-content';
  if (contentEl?.style.fontSize) {
    newContent.style.fontSize = contentEl.style.fontSize;
  }
  if (afterFrag.textContent?.trim() || afterFrag.querySelector('img, a, span, strong, em')) {
    newContent.appendChild(afterFrag);
  } else {
    newContent.innerHTML = '<br>';
  }
  newItem.appendChild(circle);
  newItem.appendChild(newContent);
  currentItem.after(newItem);
  const r = document.createRange();
  r.setStart(newContent, 0);
  r.collapse(true);
  selection.removeAllRanges();
  selection.addRange(r);
  onContentChange();
  return true;
}
