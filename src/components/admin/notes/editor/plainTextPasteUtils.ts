/**
 * Utilities for pasting content as plain text, stripping all formatting and HTML tags.
 */

/**
 * Strips all HTML tags and converts HTML entities back to clean unformatted plain text.
 */
export function stripHtmlToPlainText(html: string): string {
  if (!html) return '';

  // Replace block element closures and line breaks with newlines
  let text = html
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, '\n')
    .replace(/<(p|div|li|tr|h[1-6]|blockquote)[^>]*>/gi, '');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');

  // Normalize newlines and trim trailing block newlines
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
}

/**
 * Formats raw plain text into paragraphs for insertion into a rich-text contenteditable canvas
 * without any formatting tags, classes, or inline styles.
 */
export function formatPlainTextToHtml(text: string): string {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  return lines
    .map((line) => {
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<p>${escaped || '<br>'}</p>`;
    })
    .join('');
}
