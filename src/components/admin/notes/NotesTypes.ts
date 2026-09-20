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
  /**
   * Set by the server when a note's body lives in a blob that could not be
   * read. Distinguishes an empty note from an unavailable one so the client
   * never syncs an empty body back over the real one.
   */
  content_unavailable?: boolean;
}
export type ViewMode = 'list' | 'gallery';
export type SortOption = 'updated_desc' | 'created_desc' | 'title_asc';
/**
 * Whether the notes on screen reflect the server.
 * - 'syncing': a fetch is in flight
 * - 'synced': the list came back from the server
 * - 'error': the fetch failed, so no notes could be loaded
 * - 'unauthenticated': no session on this origin, so no fetch was attempted
 */
export type SyncState = 'syncing' | 'synced' | 'error' | 'unauthenticated';
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
export {
  formatNoteDate,
  formatNoteHeaderDate,
  extractSnippet,
  extractHashtags,
  hashPasscode,
} from './notesFormatters';
export {
  htmlToMarkdown,
  htmlToPlainText,
  deriveAutoTitleFromHtml,
} from './notesConverters';
