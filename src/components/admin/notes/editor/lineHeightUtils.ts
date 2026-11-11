/**
 * Utilities for applying intra-paragraph line spacing (CSS line-height semantics).
 * Applies line-height to the enclosing block element(s) (<p>, <li>, <h1>-<h6>, etc.)
 * controlling the vertical spacing between wrapped lines within each paragraph,
 * while leaving inter-paragraph margins completely untouched and introducing ZERO <span> wrapping.
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

function resolveTargetBlock(node: Node | null, offset: number, root: HTMLElement): HTMLElement | null {
  if (!node) return null;
  if (node === root) {
    if (root.childNodes && root.childNodes.length > 0) {
      const idx = Math.min(Math.max(0, offset), root.childNodes.length - 1);
      const child = root.childNodes[idx];
      return getBlockAncestor(child, root) || (child && (child as any).nodeType === 1 ? (child as HTMLElement) : null);
    }
    return null;
  }
  return getBlockAncestor(node, root);
}

function clearInnerLineHeightSpans(block: HTMLElement): void {
  if (typeof block.querySelectorAll === 'function') {
    const innerSpans = block.querySelectorAll<HTMLElement>('span[style*="line-height"]');
    innerSpans.forEach((s) => {
      if (s !== block) {
        s.style.lineHeight = '';
        if (!s.getAttribute('style') || !s.getAttribute('style')?.trim()) {
          s.removeAttribute('style');
        }
      }
    });
  }
}

const BLOCK_TAGS = new Set([
  'P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'TR'
]);

function isBlockElement(node: Node | null): node is HTMLElement {
  if (!node || node.nodeType !== 1) return false;
  const tag = (node as HTMLElement).tagName.toUpperCase();
  if (tag === 'DIV') {
    return !(node as HTMLElement).classList.contains('qn-checkbox-circle');
  }
  return BLOCK_TAGS.has(tag);
}

export function isRangeInEditor(r: Range | null, editorEl: HTMLElement): boolean {
  if (!r) return false;
  if (r.collapsed) return false;
  try {
    const sc = r.startContainer;
    const ec = r.endContainer;
    return Boolean(
      sc &&
      ec &&
      editorEl.contains(sc) &&
      editorEl.contains(ec) &&
      (sc as any).isConnected !== false &&
      (ec as any).isConnected !== false
    );
  } catch {
    return false;
  }
}

export function getBlocksInRange(range: Range | null, editorEl: HTMLElement): HTMLElement[] {
  if (!range || !editorEl) return [];

  // Collapsed range: resolve the single enclosing block
  if (range.collapsed) {
    let curr: Node | null = range.startContainer;
    while (curr && curr !== editorEl) {
      if (isBlockElement(curr)) {
        return [curr as HTMLElement];
      }
      curr = curr.parentNode;
    }
    const fallback = resolveTargetBlock(range.startContainer, range.startOffset, editorEl);
    if (fallback) return [fallback];
    const first = editorEl.querySelector('p, div.qn-checklist-item, li, h1, h2, h3, h4, h5, h6, blockquote') as HTMLElement;
    return first ? [first] : [editorEl];
  }

  // Non-collapsed range: Walk blocks inside editorEl using TreeWalker
  if (typeof document !== 'undefined' && typeof document.createTreeWalker === 'function') {
    const candidateBlocks: HTMLElement[] = [];
    const walker = document.createTreeWalker(
      editorEl,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node: Node) {
          if (!isBlockElement(node)) {
            return NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let currNode = walker.nextNode();
    while (currNode) {
      const el = currNode as HTMLElement;
      let intersects = false;
      try {
        if (typeof range.intersectsNode === 'function') {
          intersects = range.intersectsNode(el);
        } else {
          intersects = true;
        }
      } catch {
        intersects = false;
      }

      if (intersects) {
        candidateBlocks.push(el);
      }
      currNode = walker.nextNode();
    }

    // Filter to leaf blocks so that if an outer container block contains child blocks
    // (e.g. <div> contains <p>A</p> and <p>B</p>), we apply line-height to the child <p>s
    const leafBlocks = candidateBlocks.filter(
      (b) => !candidateBlocks.some((other) => other !== b && b.contains(other))
    );

    if (leafBlocks.length > 0) {
      return leafBlocks;
    }
  }

  // Fallback for mock environments (e.g. Node tests without full DOM TreeWalker)
  const startBlock = resolveTargetBlock(range.startContainer, range.startOffset, editorEl);
  const endBlock = resolveTargetBlock(range.endContainer, range.endOffset, editorEl) || startBlock;

  if (startBlock && endBlock) {
    if (startBlock === endBlock) {
      return [startBlock];
    }
    const all = typeof editorEl.querySelectorAll === 'function'
      ? Array.from(editorEl.querySelectorAll<HTMLElement>('p, div.qn-checklist-item, li, h1, h2, h3, h4, h5, h6, blockquote'))
      : [startBlock, endBlock];
    let inRange = false;
    const res: HTMLElement[] = [];
    for (const b of all) {
      if (b === startBlock) {
        inRange = true;
        res.push(b);
        continue;
      }
      if (inRange) {
        res.push(b);
        if (b === endBlock) break;
      } else if (b === endBlock) {
        res.push(b);
      }
    }
    if (res.length > 0) return res;
    return [startBlock, endBlock];
  }

  if (startBlock) return [startBlock];
  return [];
}

export function applySelectedLineHeight(
  editorEl: HTMLElement,
  sel: Selection | null,
  lineHeight: string,
  explicitRange?: Range | null
): boolean {
  if (!editorEl || !sel || sel.rangeCount === 0) {
    return false;
  }

  const range = explicitRange || sel.getRangeAt(0);
  if (!range) return false;

  const container = range.commonAncestorContainer || range.startContainer;
  if (container && !editorEl.contains(container)) {
    return false;
  }

  // Clone range BEFORE mutation so original selection boundaries are preserved
  let savedAfter: Range | null = null;
  try {
    if (typeof range.cloneRange === 'function') {
      savedAfter = range.cloneRange();
    }
  } catch {
    savedAfter = null;
  }

  // Find all blocks intersecting range using TreeWalker
  const blocks = getBlocksInRange(range, editorEl);
  if (!blocks || blocks.length === 0) {
    return false;
  }

  // Capture block identity
  const targets = blocks.map((b) => ({
    el: b,
    key: (b as any).dataset?.blockId ||
      ((b as any).dataset
        ? ((b as any).dataset.blockId =
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2))
        : '')
  }));

  // Apply lineHeight to each target.el without re-querying DOM during write
  targets.forEach(({ el }) => {
    el.style.lineHeight = lineHeight;
    if (typeof el.setAttribute === 'function') {
      el.setAttribute('data-line-height', lineHeight);
    }
    clearInnerLineHeightSpans(el);
  });

  // Re-select original range so selection is preserved for the next dropdown choice
  if (typeof sel.removeAllRanges === 'function') {
    let reselected = false;
    if (
      savedAfter &&
      (savedAfter.startContainer as any).isConnected !== false &&
      (savedAfter.endContainer as any).isConnected !== false &&
      editorEl.contains(savedAfter.startContainer) &&
      editorEl.contains(savedAfter.endContainer)
    ) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedAfter);
        reselected = true;
      } catch {
        reselected = false;
      }
    }

    if (!reselected && targets.length > 0 && typeof document !== 'undefined' && typeof document.createRange === 'function') {
      try {
        const newRange = document.createRange();
        newRange.setStartBefore(targets[0].el);
        newRange.setEndAfter(targets[targets.length - 1].el);
        sel.removeAllRanges();
        sel.addRange(newRange);
        reselected = true;
      } catch {
        // ignore
      }
    }
  }

  return true;
}
