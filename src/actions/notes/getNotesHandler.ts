import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { readNoteBlob } from '@/lib/blob';
import { redisMGet, redisSet } from '@/lib/redis';
import type { NoteItem, NoteRow } from './types';
import { parseTags } from './sanitizeUtils';

const noteContentMemoryCache = new Map<string, string>();
export async function handleGetNotes(
  options: { include_trashed?: boolean } = {},
  token?: string | null
): Promise<NoteItem[]> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  if (!isPaidUser(user)) throw new Error('Pro subscription required');
  const includeTrashed = Boolean(options.include_trashed);
  const rows = (includeTrashed
    ? user.role === 'admin'
      ? await sql`
          SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                 COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                 lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                 COALESCE(tags, '[]') AS tags, blob_url, created_at, updated_at
          FROM admin_notes
          WHERE user_id = ${user.id} OR user_id IS NULL
          ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
          LIMIT 500
        `
      : await sql`
          SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                 COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                 lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                 COALESCE(tags, '[]') AS tags, blob_url, created_at, updated_at
          FROM admin_notes
          WHERE user_id = ${user.id}
          ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
          LIMIT 500
        `
    : user.role === 'admin'
      ? await sql`
          SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                 COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                 lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                 COALESCE(tags, '[]') AS tags, blob_url, created_at, updated_at
          FROM admin_notes
          WHERE (is_trashed = FALSE OR is_trashed IS NULL) AND (user_id = ${user.id} OR user_id IS NULL)
          ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
          LIMIT 500
        `
      : await sql`
          SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                 COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                 lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                 COALESCE(tags, '[]') AS tags, blob_url, created_at, updated_at
          FROM admin_notes
          WHERE (is_trashed = FALSE OR is_trashed IS NULL) AND user_id = ${user.id}
          ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
          LIMIT 500
        `) as NoteRow[];
  // Batch resolve note contents for notes with blobs
  const notesWithBlob = rows.filter((r) => Boolean(r.blob_url));
  const keysToFetch: string[] = [];
  const keyToNoteMap = new Map<string, NoteRow>();

  for (const note of notesWithBlob) {
    const key = `cache:note:${note.id}:${note.updated_at}`;
    if (!noteContentMemoryCache.has(key)) {
      keysToFetch.push(key);
      keyToNoteMap.set(key, note);
    }
  }

  if (keysToFetch.length > 0) {
    const batchCached = await redisMGet<string>(keysToFetch);
    for (const key of keysToFetch) {
      const val = batchCached[key];
      if (val !== null && val !== undefined) {
        noteContentMemoryCache.set(key, val);
      }
    }
  }

  const formatted: NoteItem[] = await Promise.all(
    rows.map(async (note) => {
      let noteContent = '';
      let contentUnavailable = false;
      if (note.blob_url) {
        const cacheKey = `cache:note:${note.id}:${note.updated_at}`;
        const memoryContent = noteContentMemoryCache.get(cacheKey);
        if (memoryContent !== undefined) {
          noteContent = memoryContent;
        } else {
          const fromBlob = await readNoteBlob(note.blob_url);
          if (fromBlob !== null) {
            noteContent = fromBlob;
            noteContentMemoryCache.set(cacheKey, fromBlob);
            redisSet(cacheKey, fromBlob, 86400 * 7).catch(() => {});
          } else if (note.content) {
            noteContent = note.content;
          } else {
            contentUnavailable = true;
          }
        }
      } else {
        noteContent = note.content || '';
      }
      return {
        id: note.id,
        title: note.title || '',
        content: noteContent,
        content_unavailable: contentUnavailable,
        folder: note.folder || 'Notes',
        is_pinned: Boolean(note.is_pinned),
        is_locked: Boolean(note.is_locked),
        lock_password_hash: note.lock_password_hash || undefined,
        is_trashed: Boolean(note.is_trashed),
        tags: parseTags(note.tags),
        blob_url: note.blob_url || undefined,
        created_at: note.created_at,
        updated_at: note.updated_at || note.created_at,
      };
    })
  );
  return formatted;
}
