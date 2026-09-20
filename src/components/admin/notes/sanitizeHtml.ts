import { cleanNode, isSafeUrl } from './cleanNode';
export { isSafeUrl };
export function sanitizePlainInput(input: unknown, maxLength = 250): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
}
export function sanitizeNoteHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/\bstyle\s*=\s*['"][^'"]*(?:expression|behavior|javascript|-moz-binding|url)[^'"]*['"]/gi, '')
      .replace(/href\s*=\s*['"]?(?:javascript|data|vbscript):[^'">\s]*/gi, 'href="#"');
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const childNodes = Array.from(doc.body.childNodes);
    for (const child of childNodes) {
      cleanNode(child);
    }
    // Normalize corrupted nested checklist items or duplicated checkbox circles
    const items = doc.body.querySelectorAll('.qn-checklist-item');
    items.forEach((item) => {
      const circles = item.querySelectorAll('.qn-checkbox-circle');
      if (circles.length > 1) {
        for (let i = 1; i < circles.length; i++) {
          circles[i].remove();
        }
      }
      const nestedItems = item.querySelectorAll('.qn-checklist-item');
      nestedItems.forEach((nested) => {
        const nestedContent = nested.querySelector('.qn-checklist-content');
        if (nestedContent) {
          nested.replaceWith(...Array.from(nestedContent.childNodes));
        } else {
          nested.remove();
        }
      });
    });
    return doc.body.innerHTML;
  } catch {
    return '';
  }
}
