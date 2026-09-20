export const ALLOWED_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BODY', 'BR', 'CAPTION', 'CODE', 'COL', 'COLGROUP',
  'DEL', 'DETAILS', 'DIV', 'EM', 'FONT', 'H1', 'H2', 'H3', 'H4', 'H5',
  'H6', 'HR', 'I', 'IMG', 'INPUT', 'KBD', 'LI', 'MARK', 'OL', 'P',
  'PRE', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRIKE', 'STRONG', 'SUB', 'SUMMARY',
  'SUP', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'U', 'UL', 'VAR',
]);
export const DISALLOWED_TAGS = new Set([
  'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'FORM', 'BUTTON',
  'META', 'LINK', 'STYLE', 'BASE', 'APPLET', 'FRAME', 'FRAMESET', 'NOSCRIPT',
  'TEMPLATE', 'AUDIO', 'VIDEO', 'SOURCE',
]);
export const SAFE_PROTOCOLS = /^(https?:|mailto:|tel:|#|\/)/i;
export const DANGEROUS_STYLE_PATTERNS = /(?:expression\s*\(|behavior\s*:|javascript\s*:|-moz-binding|url\s*\()/i;
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) return true;
  return SAFE_PROTOCOLS.test(trimmed);
}
export function cleanNode(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toUpperCase();
    if (tagName === 'BODY') {
      const children = Array.from(el.childNodes);
      for (const child of children) {
        cleanNode(child);
      }
      return;
    }
    if (DISALLOWED_TAGS.has(tagName)) {
      el.remove();
      return;
    }
    if (!ALLOWED_TAGS.has(tagName)) {
      const parent = el.parentNode;
      if (parent) {
        const children = Array.from(el.childNodes);
        for (const child of children) {
          parent.insertBefore(child, el);
          cleanNode(child);
        }
        parent.removeChild(el);
      } else {
        el.remove();
      }
      return;
    }
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value;
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === 'href') {
        if (!isSafeUrl(val)) {
          el.setAttribute('href', '#');
        } else if (/^https?:\/\//i.test(val)) {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
        continue;
      }
      if (name === 'src') {
        if (tagName !== 'IMG' || (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('data:image/'))) {
          el.removeAttribute(attr.name);
        }
        continue;
      }
      if (name === 'style') {
        if (DANGEROUS_STYLE_PATTERNS.test(val)) {
          el.removeAttribute('style');
        } else {
          const cleanedStyle = val
            .replace(/(user-select|pointer-events|-webkit-user-select|-moz-user-select|position|overflow|max-height|height)\s*:\s*[^;]+;?/gi, '')
            .trim();
          if (cleanedStyle) {
            el.setAttribute('style', cleanedStyle);
          } else {
            el.removeAttribute('style');
          }
        }
        continue;
      }
      if (name === 'contenteditable' && !el.classList.contains('qn-checkbox-circle')) {
        el.removeAttribute('contenteditable');
        continue;
      }
      if (tagName === 'INPUT') {
        if (name === 'type' && val !== 'checkbox') {
          el.setAttribute('type', 'checkbox');
        }
        if (name !== 'type' && name !== 'checked' && name !== 'disabled' && name !== 'class') {
          el.removeAttribute(attr.name);
        }
        continue;
      }
      if (name === 'action' || name === 'formaction' || name === 'xlink:href') {
        el.removeAttribute(attr.name);
      }
    }
  }
  const children = Array.from(node.childNodes);
  for (const child of children) {
    cleanNode(child);
  }
}
