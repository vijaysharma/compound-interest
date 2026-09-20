import { Note, DEFAULT_CUSTOM_FOLDERS } from '../NotesTypes';
import { getUserEncryptionKey, decryptText, encryptText, isEncrypted } from '../NotesCrypto';
import { getNotesAction, getNotesStorageStatusAction, updateNoteAction } from '@/actions/notes';
interface LoadNotesResult {
  notes: Note[];
  storageProvider: 'vercel_blob' | 'database_fallback' | null;
}
export function getInitialCustomFolders(userId: string): string[] {
  try {
    const userCached = userId !== 'default' ? localStorage.getItem(`quick_notes_custom_folders_${userId}_v2`) : null;
    const legacyCached = localStorage.getItem('quick_notes_custom_folders_v2');
    const cached = userCached || legacyCached;
    return cached ? JSON.parse(cached) : DEFAULT_CUSTOM_FOLDERS;
  } catch {
    return DEFAULT_CUSTOM_FOLDERS;
  }
}
export async function loadAndDecryptNotes(
  token: string,
  userId: string,
  userEmail: string
): Promise<LoadNotesResult> {
  const key = await getUserEncryptionKey(userId, userEmail);
  const rawData = (await getNotesAction({ include_trashed: true }, token)) as unknown as Note[];
  let storageProvider: 'vercel_blob' | 'database_fallback' | null = null;
  try {
    const statusRes = await getNotesStorageStatusAction().catch(() => null);
    if (statusRes?.storage_provider) {
      storageProvider = statusRes.storage_provider as 'vercel_blob' | 'database_fallback';
    }
  } catch {
    // Ignore storage status check failure
  }
  const decryptedNotes: Note[] = await Promise.all(
    (rawData || []).map(async (n) => ({
      ...n,
      title: await decryptText(n.title || '', key),
      content: await decryptText(n.content || '', key),
    }))
  );
  const unencryptedLegacy = (rawData || []).filter(
    (n) => (n.title && !isEncrypted(n.title)) || (n.content && !isEncrypted(n.content))
  );
  if (unencryptedLegacy.length > 0) {
    void Promise.all(
      unencryptedLegacy.map(async (legacy) => {
        try {
          const encTitle = await encryptText(legacy.title || '', key);
          const encContent = await encryptText(legacy.content || '', key);
          await updateNoteAction(
            {
              id: legacy.id,
              title: encTitle,
              content: encContent,
            },
            token
          );
        } catch {
          // Ignore individual background migration error
        }
      })
    );
  }
  return { notes: decryptedNotes, storageProvider };
}
