/**
 * Utilities for applying line-height to selected text inline span style,
 * without affecting unselected document content and preserving existing formatting.
 * Supports both single-block inline selection and multi-block cross-paragraph selection.
 */

function getBlockAncestor(node: Node | null, root: HTMLElement): HTMLElement | null {
  let curr = node;
  while (curr && curr !== root) {
    if (curr && (curr as any).nodeType === 1 && /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|TR)$/i.test((curr as any).tagName)) {
      return curr as HTMLElement;
    }
    curr = curr.parentNode;
  }
  return null;
}

export function applySelectedLineHeight(
  editorEl: HTMLElement,
  sel: Selection,
  lineHeight: string
): boolean {
  if (!editorEl || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
    return false;
  }

  const range = sel.getRangeAt(0);
  if (!editorEl.contains(range.commonAncestorContainer)) {
    return false;
  }

  const startBlock = getBlockAncestor(range.startContainer, editorEl);
  const endBlock = getBlockAncestor(range.endContainer, editorEl);

  // If selection crosses block boundaries (or contains multiple block elements)
  const isMultiBlock = startBlock !== endBlock && (startBlock !== null || endBlock !== null);

  if (isMultiBlock) {
    // Multi-block selection: apply line-height per block to prevent malformed HTML
    // (e.g., placing <p> inside an inline <span>).
    const allBlocks = Array.from(
      editorEl.querySelectorAll<HTMLElement>('p, div.qn-checklist-item, li, h1, h2, h3, h4, h5, h6, blockquote')
    );

    let blocksToUpdate: HTMLElement[] = [];
    if (allBlocks.length > 0) {
      let inRange = false;
      for (const block of allBlocks) {
        if (block === startBlock) {
          inRange = true;
          blocksToUpdate.push(block);
          if (startBlock === endBlock) break;
          continue;
        }
        if (inRange) {
          blocksToUpdate.push(block);
          if (block === endBlock) {
            inRange = false;
            break;
          }
        } else if (block === endBlock) {
          blocksToUpdate.push(block);
        }
      }
    }

    if (blocksToUpdate.length === 0) {
      if (startBlock) blocksToUpdate.push(startBlock);
      if (endBlock && endBlock !== startBlock) blocksToUpdate.push(endBlock);
    }

    if (blocksToUpdate.length > 0) {
      blocksToUpdate.forEach((block) => {
        block.style.lineHeight = lineHeight;
        if (typeof block.querySelectorAll === 'function') {
          const innerSpans = block.querySelectorAll<HTMLElement>('span[style*="line-height"]');
          innerSpans.forEach((s) => {
            s.style.lineHeight = '';
            if (!s.getAttribute('style')) {
              s.removeAttribute('style');
            }
          });
        }
      });

      // Maintain selection across the updated blocks
      const newRange = document.createRange();
      const first = blocksToUpdate[0];
      const last = blocksToUpdate[blocksToUpdate.length - 1];
      if (first && last) {
        newRange.setStartBefore(first);
        newRange.setEndAfter(last);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
      return true;
    }
  }

  // Single-block or inline selection: wrap selection in an inline span
  const fragment = range.extractContents();

  // If there are existing child spans with line-height inside the selection,
  // remove their inline line-height so the new parent span style applies uniformly.
  if (fragment && typeof (fragment as any).querySelectorAll === 'function') {
    const existingSpans = (fragment as DocumentFragment).querySelectorAll<HTMLElement>('span[style*="line-height"]');
    existingSpans.forEach((s) => {
      s.style.lineHeight = '';
      if (!s.getAttribute('style')) {
        s.removeAttribute('style');
      }
    });
  }

  // Create the inline span carrying the line-height style
  const span = document.createElement('span');
  span.style.lineHeight = lineHeight;
  span.appendChild(fragment);

  // Insert into DOM at the range position
  range.insertNode(span);

  // Re-select the contents of the span to maintain user selection
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.removeAllRanges();
  sel.addRange(newRange);

  return true;
}
