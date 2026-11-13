import { cleanNode, isSafeUrl, scrubCanvasChildFocusables } from './cleanNode';
export { isSafeUrl, scrubCanvasChildFocusables };
export function sanitizePlainInput(input: unknown, maxLength = 250, trim = true): string {
  if (typeof input !== 'string') return '';
  const cleaned = input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLength);
  return trim ? cleaned.trim() : cleaned;
}
export function sanitizeNoteHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  // Pre-strip Microsoft Office/Word XML, comments, and empty o:p elements
  const preprocessed = html
    .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<xml\b[\s\S]*?<\/xml>/gi, '')
    .replace(/<o:p\b[^>]*>[\s\S]*?<\/o:p>/gi, (match) => {
      const inner = match.replace(/<\/?o:p[^>]*>/gi, '').replace(/&nbsp;|\s/g, '');
      return inner ? match.replace(/<\/?o:p[^>]*>/gi, '') : '';
    });

  if (typeof DOMParser === 'undefined') {
    return preprocessed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<math\b[^<]*(?:(?!<\/math>)<[^<]*)*<\/math>/gi, '')
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/\btabindex\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/\bcontenteditable\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/<span\b([^>]*class=['"][^'"]*qn-checkbox-circle[^'"]*['"][^>]*)>/gi, (match) => {
        return match.replace(/>$/, ' contenteditable="false">');
      })
      .replace(/\bstyle\s*=\s*['"][^'"]*(?:expression|behavior|javascript|-moz-binding|url)[^'"]*['"]/gi, '')
      .replace(/\bmso-[^;"]+;?/gi, '')
      .replace(/href\s*=\s*['"]?(?:javascript|data|vbscript):[^'">\s]*/gi, 'href="#"');
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(preprocessed, 'text/html');
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
    // Ensure .qn-note-canvas will be the ONLY focusable element
    scrubCanvasChildFocusables(doc.body);
    return doc.body.innerHTML;
  } catch {
    return '';
  }
}
