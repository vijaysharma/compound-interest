export interface Note {
  id: string;
  title: string;
  content: string;
  folder: string;
  is_pinned: boolean;
  is_locked: boolean;
  lock_password_hash?: string;
  is_trashed: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}
export type ViewMode = 'list' | 'gallery';
export type SortOption = 'updated_desc' | 'created_desc' | 'title_asc';
export interface FolderItem {
  id: string;
  name: string;
  isSystem?: boolean;
  icon?: string;
  count?: number;
}
export const SYSTEM_FOLDERS = {
  ALL: 'all',
  QUICK_NOTES: 'Quick Notes',
  PINNED: 'pinned',
  TRASH: 'trash',
} as const;
export const DEFAULT_CUSTOM_FOLDERS = ['Notes', 'Work', 'Personal', 'Ideas'];
/**
 * Formats date into standard Quick Notes list item style:
 * - "2:45 PM" if today
 * - "Yesterday" if yesterday
 * - "Tue" if within past 7 days
 * - "Sep 5" if current year
 * - "09/05/25" if previous years
 */
export function formatNoteDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) {
    return 'Yesterday';
  }
  const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
}
/**
 * Formats date into editor header style:
 * "September 5, 2026 at 4:15 PM"
 */
export function formatNoteHeaderDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} at ${timePart}`;
}
/**
 * Extract clean plain text snippet for note cards
 */
export function extractSnippet(html: string): string {
  if (!html) return 'No additional text';
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  return text || 'No additional text';
}
/**
 * Extract tags from content (finds #tag words)
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const clean = text.replace(/<[^>]+>/g, ' ');
  const regex = /#([a-zA-Z0-9_-]+)/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    if (match[1]) {
      matches.add(match[1].toLowerCase());
    }
  }
  return Array.from(matches);
}
/**
 * Simple SHA-256 password hash using SubtleCrypto
 */
export async function hashPasscode(passcode: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
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
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="true"[^>]*>[\s\S]*?<span[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/span><\/div>/gi,
    '- [x] $1\n'
  );
  text = text.replace(
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="false"[^>]*>[\s\S]*?<span[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/span><\/div>/gi,
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
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="true"[^>]*>[\s\S]*?<span[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/span><\/div>/gi,
    '[✓] $1\n'
  );
  text = text.replace(
    /<div[^>]*class="[^"]*qn-checklist-item[^"]*"[^>]*data-checked="false"[^>]*>[\s\S]*?<span[^>]*class="[^"]*qn-checklist-content[^"]*"[^>]*>([\s\S]*?)<\/span><\/div>/gi,
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
