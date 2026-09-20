import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { deleteNoteBlobs, isBlobConfigured, putNoteBlob } from '@/lib/blob';
import { RestoreNotesBackupInput } from './types';
import {
  parseTags,
  sanitizeServerContent,
  sanitizeServerId,
  sanitizeServerPlain,
  sanitizeServerTitle,
} from './sanitizeUtils';
export async function handleRestoreNotesBackup(
  body: RestoreNotesBackupInput,
  token?: string | null
): Promise<{ success: boolean; count: number }> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  if (!isPaidUser(user)) throw new Error('Pro subscription required');
  const backupNotes = Array.isArray(body?.notes) ? body.notes : [];
  if (backupNotes.length === 0) {
    throw new Error('No notes provided in backup');
  }
  if (body.replace) {
    const oldRows = (user.role === 'admin'
      ? await sql`SELECT blob_url FROM admin_notes WHERE user_id = ${user.id} OR user_id IS NULL`
      : await sql`SELECT blob_url FROM admin_notes WHERE user_id = ${user.id}`) as {
      blob_url?: string | null;
    }[];
    const oldBlobs = oldRows
      .map((r) => r.blob_url)
      .filter((u): u is string => typeof u === 'string' && Boolean(u));
    if (oldBlobs.length > 0) {
      await deleteNoteBlobs(oldBlobs);
    }
    if (user.role === 'admin') {
      await sql`DELETE FROM admin_notes WHERE user_id = ${user.id} OR user_id IS NULL`;
    } else {
      await sql`DELETE FROM admin_notes WHERE user_id = ${user.id}`;
    }
  }
  let count = 0;
  for (const n of backupNotes) {
    const id = sanitizeServerId(n.id);
    const title = sanitizeServerTitle(n.title);
    const content = sanitizeServerContent(n.content);
    const folder = sanitizeServerPlain(n.folder, 100) || 'Notes';
    const isPinned = Boolean(n.is_pinned);
    const isLocked = Boolean(n.is_locked);
    const lockHash = n.lock_password_hash || null;
    const isTrashed = Boolean(n.is_trashed);
    const tagsJson = JSON.stringify(parseTags(n.tags));
    const blobUrl = await putNoteBlob(user.id, id, content);
    await sql`
      INSERT INTO admin_notes (
        id, user_id, title, content, folder, is_pinned, is_locked, lock_password_hash, is_trashed, tags, blob_url, created_at, updated_at
      )
      VALUES (
        ${id}, ${user.id}, ${title}, ${content}, ${folder}, ${isPinned}, ${isLocked}, ${lockHash}, ${isTrashed}, ${tagsJson}, ${blobUrl}, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        blob_url = EXCLUDED.blob_url,
        folder = EXCLUDED.folder,
        is_pinned = EXCLUDED.is_pinned,
        is_locked = EXCLUDED.is_locked,
        lock_password_hash = EXCLUDED.lock_password_hash,
        is_trashed = EXCLUDED.is_trashed,
        tags = EXCLUDED.tags,
        user_id = ${user.id},
        updated_at = NOW()
    `;
    count++;
  }
  return { success: true, count };
}
export async function handleGetNotesStorageStatus(): Promise<{
  vercel_blob_enabled: boolean;
  storage_provider: string;
  message: string;
}> {
  const isBlobActive = isBlobConfigured();
  return {
    vercel_blob_enabled: isBlobActive,
    storage_provider: isBlobActive ? 'vercel_blob' : 'database_fallback',
    message: isBlobActive
      ? 'Vercel Blob storage is active. Note bodies are synced to Vercel Blob, with a copy retained in PostgreSQL so reads never depend on blob availability.'
      : 'BLOB_READ_WRITE_TOKEN is not configured in environment variables. Notes are saved in the PostgreSQL database only.',
  };
}
