export function applyCollapsedFontSize(
  editorEl: HTMLElement,
  range: Range,
  sel: Selection,
  sizePx: string,
  currentFontSize: string
): void {
  const block = (
    sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement
  )?.closest('p, div:not(.qn-note-canvas), li, .qn-checklist-content, h1, h2, h3, blockquote');
  if (block && editorEl.contains(block)) {
    (block as HTMLElement).style.fontSize = sizePx;
  }
  const topBlocks = editorEl.children;
  for (let i = 0; i < topBlocks.length; i++) {
    const child = topBlocks[i] as HTMLElement;
    if (child.classList.contains('qn-checklist-item')) {
      const content = child.querySelector('.qn-checklist-content') as HTMLElement | null;
      if (content && (!content.style.fontSize || content.style.fontSize === currentFontSize)) {
        content.style.fontSize = sizePx;
      }
    } else if (child.tagName === 'P' || child.tagName === 'DIV') {
      if (!child.style.fontSize || child.style.fontSize === currentFontSize) {
        child.style.fontSize = sizePx;
      }
    }
  }
  const span = document.createElement('span');
  span.style.fontSize = sizePx;
  span.innerHTML = '&#8203;';
  range.insertNode(span);
  const newRange = document.createRange();
  newRange.setStart(span.childNodes[0], 1);
  newRange.collapse(true);
  sel.removeAllRanges();
  sel.addRange(newRange);
}
export function applySelectedFontSize(
  editorEl: HTMLElement,
  sel: Selection,
  sizePx: string,
  cmdVal: string
): void {
  document.execCommand('fontSize', false, cmdVal);
  const fontEls = editorEl.querySelectorAll(`font[size="${cmdVal}"]`);
  fontEls.forEach((el) => {
    (el as HTMLElement).style.fontSize = sizePx;
  });
  const anchorBlock = (
    sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode?.parentElement
  )?.closest('p, div:not(.qn-note-canvas), li, .qn-checklist-content');
  if (anchorBlock && editorEl.contains(anchorBlock)) {
    (anchorBlock as HTMLElement).style.fontSize = sizePx;
  }
}
