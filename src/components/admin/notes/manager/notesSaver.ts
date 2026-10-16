import { Note } from '../NotesTypes';
import { getUserEncryptionKey, encryptText } from '../NotesCrypto';
import { createNoteAction, updateNoteAction } from '@/actions/notes';
interface SavePendingNotesParams {
  notes: Note[];
  pendingIds: string[];
  token: string;
  userId: string;
  userEmail: string;
  unconfirmedCreates: Set<string>;
}
export interface SavedNoteMeta {
  id: string;
  updated_at?: string;
}
interface SavePendingNotesResult {
  deletedElsewhereIds: string[];
  staleWrite: boolean;
  savedIds: string[];
  savedNotes: SavedNoteMeta[];
}
export async function savePendingNotes({
  notes,
  pendingIds,
  token,
  userId,
  userEmail,
  unconfirmedCreates,
}: SavePendingNotesParams): Promise<SavePendingNotesResult> {
  const key = await getUserEncryptionKey(userId, userEmail);
  const deletedElsewhereIds: string[] = [];
  const savedIds: string[] = [];
  const savedNotes: SavedNoteMeta[] = [];
  let staleWrite = false;
  for (const noteId of pendingIds) {
    const note = notes.find((n) => n.id === noteId);
    if (!note) {
      savedIds.push(noteId);
      continue;
    }
    if (note.content_unavailable) continue;
    const payload = {
      id: note.id,
      title: await encryptText(note.title || '', key),
      content: await encryptText(note.content || '', key),
      folder: note.folder,
      is_pinned: note.is_pinned,
      is_locked: note.is_locked,
      lock_password_hash: note.lock_password_hash ?? null,
      is_trashed: note.is_trashed,
      tags: note.tags,
    };
    if (unconfirmedCreates.has(noteId)) {
      const created = await createNoteAction(
        { ...payload, lock_password_hash: payload.lock_password_hash ?? undefined },
        token
      );
      unconfirmedCreates.delete(noteId);
      savedIds.push(noteId);
      savedNotes.push({ id: noteId, updated_at: created.updated_at });
      continue;
    }
    const res = await updateNoteAction(
      { ...payload, client_updated_at: note.updated_at },
      token
    );
    if (res?.success) {
      savedIds.push(noteId);
      savedNotes.push({ id: noteId, updated_at: res.updated_at });
    } else if (res?.rejected === 'missing') {
      deletedElsewhereIds.push(noteId);
    } else if (res?.rejected === 'stale') {
      staleWrite = true;
    }
  }
  return { deletedElsewhereIds, staleWrite, savedIds, savedNotes };
}
