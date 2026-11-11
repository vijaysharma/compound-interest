import type { Note } from '../NotesTypes';
const DRAFT_PREFIX = 'quick_notes_drafts_';
export function getDraftStorageKey(userId: string): string {
  return `${DRAFT_PREFIX}${userId || 'default'}_v1`;
}
export function getAllLocalDrafts(userId: string): Record<string, Note> {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return {};
  try {
    const key = getDraftStorageKey(userId);
    const raw = globalThis.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
export function saveLocalDraft(userId: string, note: Note): void {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
  if (!note?.id) return;
  const key = getDraftStorageKey(userId);
  let existing: Record<string, Note> = {};
  try {
    existing = getAllLocalDrafts(userId);
  } catch {
    existing = {};
  }
  try {
    existing[note.id] = note;
    globalThis.localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    // On QuotaExceededError or Safari private-mode throw, fall back to persisting
    // metadata only (drop body) so restore-on-mount surfaces a 'draft body lost' state
    // instead of failing silently.
    console.warn('saveLocalDraft: storage quota exceeded or private mode, attempting metadata fallback:', err);
    try {
      existing[note.id] = {
        ...note,
        content: '',
        is_draft_body_lost: true,
      };
      globalThis.localStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // Complete storage rejection (e.g. strict 0KB private browsing quota)
    }
  }
}
export function removeLocalDraft(userId: string, noteId: string): void {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
  if (!noteId) return;
  try {
    const key = getDraftStorageKey(userId);
    const existing = getAllLocalDrafts(userId);
    if (existing[noteId]) {
      delete existing[noteId];
      globalThis.localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch {
    // Ignore storage errors
  }
}
function hasDraftDiff(draft: Note, serverNote: Note): boolean {
  if (draft.title !== serverNote.title) return true;
  if (draft.content !== serverNote.content) return true;
  if (draft.folder !== serverNote.folder) return true;
  if (Boolean(draft.is_pinned) !== Boolean(serverNote.is_pinned)) return true;
  if (Boolean(draft.is_trashed) !== Boolean(serverNote.is_trashed)) return true;
  const draftTags = (draft.tags || []).slice().sort().join(',');
  const serverTags = (serverNote.tags || []).slice().sort().join(',');
  if (draftTags !== serverTags) return true;
  return false;
}
/**
 * Draft-vs-Server Conflict Policy:
 * 1. Timestamp-guarded Last-Writer-Wins with Diff Detection:
 *    - If local draft has changes (hasDraftDiff) AND draft.updated_at >= serverNote.updated_at:
 *      The local draft wins, overrides server state in memory, and is marked as an unsaved
 *      draft (added to unsavedDraftIds / savePendingRef) so it gets pushed to the server.
 *    - If draft.updated_at < serverNote.updated_at (server has newer edits from another client)
 *      OR there is no meaningful difference (!hasDraftDiff):
 *      The server note wins and the obsolete local draft is evicted from localStorage.
 * 2. Unconfirmed/Offline Creations:
 *    - If a note exists in local drafts but not yet on server, it is preserved and queued
 *      for server synchronization upon reconnection.
 */
export function reconcileNotesWithLocalDrafts(
  userId: string,
  serverNotes: Note[]
): { reconciled: Note[]; unsavedDraftIds: string[] } {
  const drafts = getAllLocalDrafts(userId);
  const draftIds = Object.keys(drafts);
  if (draftIds.length === 0) {
    return { reconciled: serverNotes, unsavedDraftIds: [] };
  }
  const unsavedDraftIds: string[] = [];
  const serverMap = new Map<string, Note>();
  serverNotes.forEach((n) => serverMap.set(n.id, n));
  for (const [id, draft] of Object.entries(drafts)) {
    const serverNote = serverMap.get(id);
    if (!serverNote) {
      if (!draft.is_trashed) {
        serverNotes.push(draft);
        unsavedDraftIds.push(id);
      }
    } else {
      const serverTime = new Date(serverNote.updated_at || serverNote.created_at || 0).getTime();
      const draftTime = new Date(draft.updated_at || draft.created_at || 0).getTime();
      const diff = hasDraftDiff(draft, serverNote);
      if (draftTime > serverTime && diff) {
        if (draft.is_draft_body_lost) {
          // Metadata was preserved but body was dropped due to storage quota:
          // Keep server content to avoid blanking note, but flag that body was lost.
          serverMap.set(id, { ...serverNote, ...draft, content: serverNote.content, is_draft_body_lost: true });
        } else {
          serverMap.set(id, { ...serverNote, ...draft });
        }
        unsavedDraftIds.push(id);
      } else if (draftTime <= serverTime || !diff) {
        removeLocalDraft(userId, id);
      }
    }
  }
  const reconciled = Array.from(serverMap.values());
  return { reconciled, unsavedDraftIds };
}
