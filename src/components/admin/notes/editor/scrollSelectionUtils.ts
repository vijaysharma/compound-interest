/**
 * Scroll selection into view utility for Quick Notes editor.
 * Mitigates the iOS 18 WebKit scroll-anchoring regression where tapping near
 * the bottom of a contenteditable element inside a scrollable container
 * unexpectedly scrolls the container to the top.
 */

export interface ScrollSelectionOptions {
  block?: ScrollLogicalPosition;
  checkViewport?: boolean;
}

/**
 * Safely scrolls the current selection in the editor into view using a temporary span.
 * On WebKit (iOS Chrome / Safari), range.getBoundingClientRect() frequently returns
 * 0s when collapsed, and Range has no native scrollIntoView. A temporary inline span
 * inserted at the caret position provides a real layout box for scrollIntoView({ block: 'center' }).
 */
export function scrollSelectionIntoView(
  editor: HTMLElement | null,
  canvasContainer?: HTMLElement | null,
  options: ScrollSelectionOptions = {}
): boolean {
  if (!editor || typeof window === 'undefined') return false;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  if (!editor.contains(sel.anchorNode)) return false;

  const block = options.block || 'center';
  const range = sel.getRangeAt(0);

  // Preserve range information to restore after removing the temporary span
  const isCollapsed = range.collapsed;
  const startContainer = range.startContainer;
  const startOffset = range.startOffset;
  const endContainer = range.endContainer;
  const endOffset = range.endOffset;

  // Create temporary zero-width span
  const tempSpan = document.createElement('span');
  tempSpan.textContent = '\u200B';
  tempSpan.setAttribute('data-scroll-anchor', 'true');
  tempSpan.setAttribute('aria-hidden', 'true');
  tempSpan.style.display = 'inline';
  tempSpan.style.position = 'relative';
  tempSpan.style.lineHeight = 'inherit';
  tempSpan.style.pointerEvents = 'none';

  const insertRange = range.cloneRange();
  insertRange.collapse(true);

  try {
    insertRange.insertNode(tempSpan);

    if (typeof tempSpan.scrollIntoView === 'function') {
      tempSpan.scrollIntoView({ block, behavior: 'auto' });
    }

    // Use Visual Viewport API when available (e.g. iOS virtual keyboard active)
    if (options.checkViewport !== false && window.visualViewport && canvasContainer) {
      const vv = window.visualViewport;
      const spanRect = tempSpan.getBoundingClientRect();
      const containerRect = canvasContainer.getBoundingClientRect();
      const visibleTop = Math.max(containerRect.top, vv.offsetTop);
      const visibleBottom = Math.min(containerRect.bottom, vv.offsetTop + vv.height) - 44;

      if (spanRect.bottom > visibleBottom) {
        canvasContainer.scrollTop += (spanRect.bottom - visibleBottom) + 20;
      } else if (spanRect.top < visibleTop) {
        canvasContainer.scrollTop -= (visibleTop - spanRect.top) + 20;
      }
    }
    return true;
  } catch {
    return false;
  } finally {
    // Always remove the temporary span and normalize text nodes
    const parent = tempSpan.parentNode;
    if (parent) {
      parent.removeChild(tempSpan);
      parent.normalize();
    }

    // Safely restore selection range
    try {
      if (startContainer && startContainer.isConnected) {
        const restoredRange = document.createRange();
        const startMax = startContainer.nodeType === 3 /* TEXT_NODE */
          ? (startContainer.textContent?.length || 0)
          : (startContainer.childNodes?.length || 0);
        restoredRange.setStart(startContainer, Math.min(startOffset, startMax));

        if (isCollapsed || !endContainer?.isConnected) {
          restoredRange.collapse(true);
        } else {
          const endMax = endContainer.nodeType === 3 /* TEXT_NODE */
            ? (endContainer.textContent?.length || 0)
            : (endContainer.childNodes?.length || 0);
          restoredRange.setEnd(endContainer, Math.min(endOffset, endMax));
        }

        sel.removeAllRanges();
        sel.addRange(restoredRange);
      }
    } catch {
      // Graceful fallback if selection restoration fails
    }
  }
}
