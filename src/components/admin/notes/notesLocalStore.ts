import type { Note } from './NotesTypes';
/**
 * localStorage write-ahead buffer for Quick Notes.
 *
 * Blob storage (referenced from `admin_notes`) is the durable store. This
 * module is the local buffer in front of it: edits land here immediately so
 * nothing is lost between the periodic remote syncs, and `dirty` records which
 * notes still owe the server a write.
 *
 * The buffer is per user AND per origin, so localhost and production keep
 * separate buffers. That is intentional — it is a buffer, not a replica.
 */
export interface LocalNotesSnapshot {
  notes: Note[];
  /** Note ids with edits that have not reached the server yet. */
  dirty: string[];
  /** ISO timestamp of the last successful full sync, if any. */
  syncedAt: string | null;
}
const EMPTY: LocalNotesSnapshot = { notes: [], dirty: [], syncedAt: null };
export function notesCacheKey(userId: string): string {
  return `quick_notes_cache_${userId}_v2`;
}
function metaKey(userId: string): string {
  return `quick_notes_sync_meta_${userId}_v1`;
}
/**
 * Reads the buffer. Note bodies live under the v2 cache key that earlier
 * versions already wrote, so existing local data is picked up as-is; only the
 * dirty/syncedAt metadata is new.
 */
export function readLocalNotes(userId: string): LocalNotesSnapshot {
  if (typeof window === 'undefined') return EMPTY;
  let notes: Note[] = [];
  try {
    const raw =
      localStorage.getItem(notesCacheKey(userId)) ||
      localStorage.getItem('quick_notes_cache_v2');
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) notes = parsed as Note[];
  } catch {
    notes = [];
  }
  let dirty: string[] = [];
  let syncedAt: string | null = null;
  try {
    const rawMeta = localStorage.getItem(metaKey(userId));
    if (rawMeta) {
      const meta = JSON.parse(rawMeta) as { dirty?: unknown; syncedAt?: unknown };
      if (Array.isArray(meta.dirty)) {
        dirty = meta.dirty.filter((id): id is string => typeof id === 'string');
      }
      if (typeof meta.syncedAt === 'string') syncedAt = meta.syncedAt;
    }
  } catch {
    // Corrupt metadata: treat every local note as needing a sync rather than
    // assuming they are all safely on the server.
    dirty = notes.map((n) => n.id);
  }
  return { notes, dirty, syncedAt };
}
export function writeLocalNotes(
  userId: string,
  notes: Note[],
  dirty: Iterable<string>,
  syncedAt: string | null
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(notesCacheKey(userId), JSON.stringify(notes));
    localStorage.setItem(
      metaKey(userId),
      JSON.stringify({ dirty: Array.from(dirty), syncedAt })
    );
  } catch (err) {
    // Quota exceeded is the realistic failure here. Nothing useful to do
    // locally, but it must not be silent: the next sync is now the only copy.
    console.error('Failed to persist notes locally:', err);
  }
}
function timeOf(note: Note): number {
  const t = Date.parse(note.updated_at || note.created_at || '');
  return Number.isNaN(t) ? 0 : t;
}
export interface MergeResult {
  notes: Note[];
  /** Ids still owing the server a write after the merge. */
  dirty: string[];
}
/**
 * Reconciles a server fetch with the local buffer.
 *
 * Rules, applied per note id:
 * - dirty locally and local is at least as new  -> keep local, stay dirty
 * - dirty locally but remote is strictly newer  -> take remote, drop dirty
 *   (another device won; the local edit is superseded rather than silently
 *   overwriting the newer remote copy)
 * - not dirty                                   -> take remote
 * - local only, dirty                           -> keep, stay dirty (not yet created server-side)
 * - local only, clean                           -> drop (deleted elsewhere)
 *
 * A remote note flagged `content_unavailable` never replaces a local body,
 * because its empty content would otherwise be synced back over the blob.
 */
export function mergeRemoteWithLocal(
  remote: Note[],
  local: Note[],
  dirty: Iterable<string>
): MergeResult {
  const dirtySet = new Set(dirty);
  const localById = new Map(local.map((n) => [n.id, n]));
  const merged: Note[] = [];
  const nextDirty = new Set<string>();
  for (const remoteNote of remote) {
    const localNote = localById.get(remoteNote.id);
    localById.delete(remoteNote.id);
    if (!localNote) {
      merged.push(remoteNote);
      continue;
    }
    const unreadableRemote = Boolean(remoteNote.content_unavailable);
    if (unreadableRemote) {
      // Keep whatever we hold locally and leave it dirty so the real body is
      // pushed back up, repairing the row.
      merged.push({ ...remoteNote, content: localNote.content, title: localNote.title });
      nextDirty.add(remoteNote.id);
      continue;
    }
    if (dirtySet.has(remoteNote.id) && timeOf(localNote) >= timeOf(remoteNote)) {
      merged.push(localNote);
      nextDirty.add(remoteNote.id);
    } else {
      merged.push(remoteNote);
    }
  }
  // Anything left is local-only.
  for (const leftover of localById.values()) {
    if (dirtySet.has(leftover.id)) {
      merged.push(leftover);
      nextDirty.add(leftover.id);
    }
  }
  merged.sort((a, b) => {
    if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1;
    return timeOf(b) - timeOf(a);
  });
  return { notes: merged, dirty: Array.from(nextDirty) };
}
