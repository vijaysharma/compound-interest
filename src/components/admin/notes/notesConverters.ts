/**
 * Converts Note HTML to Markdown for export
 */
export function htmlToMarkdown(title: string, html: string): string {
  let md = '';
  if (title) {
    md += `# ${title}\n\n`;
  }
  if (!html) return md;
  let text = html;
  // Handle checklist items
  text = text.replace(
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="true"[^>]*>[\s\S]*?<(?:span|div)[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)><\/div>/gi,
    '- [x] $1\n'
  );
  text = text.replace(
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="false"[^>]*>[\s\S]*?<(?:span|div)[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)><\/div>/gi,
    '- [ ] $1\n'
  );
  // Headings
  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  // Formatting
  text = text.replace(/<(b|strong)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  text = text.replace(/<(i|em)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  text = text.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '__$1__');
  text = text.replace(/<(s|strike|del)[^>]*>([\s\S]*?)<\/\1>/gi, '~~$2~~');
  text = text.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==');
  // Code
  text = text.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, '```\n$1\n```\n\n');
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  // Quotes
  text = text.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '> $1\n\n');
  // Lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  text = text.replace(/<\/?ul[^>]*>/gi, '\n');
  text = text.replace(/<\/?ol[^>]*>/gi, '\n');
  // Paragraphs
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n\n');
  // Clean remaining tags
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  md += text.trim();
  return md;
}
/**
 * Converts Note HTML to clean plain text
 */
export function htmlToPlainText(title: string, html: string): string {
  let plain = '';
  if (title) {
    plain += `${title}\n\n`;
  }
  if (!html) return plain;
  let text = html;
  text = text.replace(
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="true"[^>]*>[\s\S]*?<(?:span|div)[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)><\/div>/gi,
    '[✓] $1\n'
  );
  text = text.replace(
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="false"[^>]*>[\s\S]*?<(?:span|div)[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div)><\/div>/gi,
    '[ ] $1\n'
  );
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n$1\n');
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');
  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<hr\s*\/?>/gi, '\n---\n');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
  plain += text.trim();
  return plain;
}
/**
 * Automatically derives a title from the note's content HTML.
 * Takes the first non-empty line of text, truncating up to 50 characters.
 */
export function deriveAutoTitleFromHtml(html: string): string {
  if (!html) return '';
  const text = htmlToPlainText('', html).trim();
  if (!text) return '';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  let firstLine = lines[0];
  firstLine = firstLine
    .replace(/^\[[ ✓xX]\]\s*/, '')
    .replace(/^[-*•]\s+/, '')
    .replace(/^#+\s+/, '')
    .trim();
  if (firstLine.length > 50) {
    firstLine = firstLine.substring(0, 50).trim() + '...';
  }
  return firstLine;
}
