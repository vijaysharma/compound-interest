import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { readNoteBlob } from '@/lib/blob';
import { redisGet, redisSet } from '@/lib/redis';
import { NoteItem, NoteRow } from './types';
import { parseTags } from './sanitizeUtils';
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
  const formatted: NoteItem[] = await Promise.all(
    rows.map(async (note) => {
      let noteContent = '';
      let contentUnavailable = false;
      if (note.blob_url) {
        const cacheKey = `cache:note:${note.id}:${note.updated_at}`;
        const cachedContent = await redisGet<string>(cacheKey);
        if (cachedContent !== null) {
          noteContent = cachedContent;
        } else {
          const fromBlob = await readNoteBlob(note.blob_url);
          if (fromBlob !== null) {
            noteContent = fromBlob;
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
