export interface NoteRow {
  id: string;
  user_id?: string | null;
  title: string | null;
  content: string;
  folder: string | null;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  lock_password_hash: string | null;
  is_trashed: boolean | null;
  tags: string | null;
  blob_url?: string | null;
  created_at: string;
  updated_at: string;
}
export interface NoteItem {
  id: string;
  title: string;
  content: string;
  /**
   * True when the body lives in a blob that could not be read. Distinguishes
   * "this note is empty" from "this note's body is temporarily unavailable",
   * so the client never syncs an empty body back over a real one.
   */
  content_unavailable?: boolean;
  folder: string;
  is_pinned: boolean;
  is_locked: boolean;
  lock_password_hash?: string;
  is_trashed: boolean;
  tags: string[];
  blob_url?: string;
  created_at: string;
  updated_at: string;
}
export interface CreateNoteInput {
  id?: string;
  title?: string;
  content?: string;
  folder?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  lock_password_hash?: string;
  is_trashed?: boolean;
  tags?: string[];
}
export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  folder?: string;
  is_pinned?: boolean;
  is_locked?: boolean;
  lock_password_hash?: string | null;
  is_trashed?: boolean;
  tags?: string[];
  /** updated_at of the copy this write is based on, for staleness checks. */
  client_updated_at?: string;
}
export interface RestoreNotesBackupInput {
  notes: Array<{
    id?: string;
    title?: string;
    content?: string;
    folder?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
    lock_password_hash?: string;
    is_trashed?: boolean;
    tags?: string[];
  }>;
  replace?: boolean;
}
