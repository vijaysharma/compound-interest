import { type Note, DEFAULT_CUSTOM_FOLDERS } from '../NotesTypes';
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
const NOTES_CACHE_VERSION = 'v2';
export function getInitialCachedNotes(userId: string): Note[] {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return [];
  try {
    const key = `quick_notes_${userId || 'default'}_notes_cache_${NOTES_CACHE_VERSION}`;
    const raw = globalThis.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Note[]) : [];
  } catch {
    return [];
  }
}
export function cacheDecryptedNotes(userId: string, notes: Note[]): void {
  if (typeof window === 'undefined' && typeof globalThis.localStorage === 'undefined') return;
  try {
    const key = `quick_notes_${userId || 'default'}_notes_cache_${NOTES_CACHE_VERSION}`;
    globalThis.localStorage.setItem(key, JSON.stringify(notes));
  } catch {
    // Quota exceeded or storage unavailable
  }
}
export async function loadAndDecryptNotes(
  token: string,
  userId: string,
  userEmail: string
): Promise<LoadNotesResult> {
  const [key, rawDataResult, statusRes] = await Promise.all([
    getUserEncryptionKey(userId, userEmail),
    getNotesAction({ include_trashed: true }, token).catch(() => [] as Note[]),
    getNotesStorageStatusAction().catch(() => null),
  ]);
  const rawData = (rawDataResult || []) as unknown as Note[];
  const storageProvider: 'vercel_blob' | 'database_fallback' | null =
    statusRes?.storage_provider === 'vercel_blob' || statusRes?.storage_provider === 'database_fallback'
      ? statusRes.storage_provider
      : null;
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
