import { Note } from '../NotesTypes';
import { getUserEncryptionKey, encryptText, decryptText } from '../NotesCrypto';
import { createNoteAction } from '@/actions/notes';
interface CreateEncryptedNoteParams {
  note: Note;
  token: string;
  userId: string;
  userEmail: string;
}
export async function createEncryptedNote({
  note,
  token,
  userId,
  userEmail,
}: CreateEncryptedNoteParams): Promise<Note> {
  const key = await getUserEncryptionKey(userId, userEmail);
  const encTitle = await encryptText(note.title || '', key);
  const encContent = await encryptText(note.content || '', key);
  const created = (await createNoteAction({
    id: note.id,
    title: encTitle,
    content: encContent,
    folder: note.folder,
    tags: note.tags,
    is_pinned: note.is_pinned,
  }, token)) as unknown as Note;
  return {
    ...created,
    title: await decryptText(created.title || '', key),
    content: await decryptText(created.content || '', key),
  };
}
