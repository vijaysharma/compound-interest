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
  try {
    const key = getDraftStorageKey(userId);
    const existing = getAllLocalDrafts(userId);
    existing[note.id] = note;
    globalThis.localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // Ignore quota errors
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
      const hasContentDiff = draft.content !== serverNote.content || draft.title !== serverNote.title;
      if (draftTime >= serverTime && hasContentDiff) {
        serverMap.set(id, { ...serverNote, ...draft });
        unsavedDraftIds.push(id);
      } else if (draftTime < serverTime && !hasContentDiff) {
        removeLocalDraft(userId, id);
      }
    }
  }
  const reconciled = Array.from(serverMap.values());
  return { reconciled, unsavedDraftIds };
}
