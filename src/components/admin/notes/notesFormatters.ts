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
