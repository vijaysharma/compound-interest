import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { deleteNoteBlobs, putNoteBlob } from '@/lib/blob';
import { UpdateNoteInput } from './types';
import {
  parseTags,
  sanitizeServerContent,
  sanitizeServerId,
  sanitizeServerPlain,
  sanitizeServerTitle,
} from './sanitizeUtils';
export async function handleUpdateNote(
  body: UpdateNoteInput,
  token?: string | null
): Promise<{
  success: boolean;
  id: string;
  rejected?: 'missing' | 'stale';
}> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  if (!isPaidUser(user)) throw new Error('Pro subscription required');
  if (!body?.id) {
    throw new Error('Note ID is required');
  }
  const noteId = sanitizeServerId(body.id);
  const existing = (user.role === 'admin'
    ? await sql`SELECT id, updated_at FROM admin_notes WHERE id = ${noteId} AND (user_id = ${user.id} OR user_id IS NULL) LIMIT 1`
    : await sql`SELECT id, updated_at FROM admin_notes WHERE id = ${noteId} AND user_id = ${user.id} LIMIT 1`) as {
    id: string;
    updated_at?: string | null;
  }[];
  if (existing.length === 0) {
    return { success: false, id: noteId, rejected: 'missing' };
  }
  if (body.client_updated_at && existing[0].updated_at) {
    const incoming = Date.parse(body.client_updated_at);
    const stored = Date.parse(existing[0].updated_at);
    if (Number.isFinite(incoming) && Number.isFinite(stored) && incoming < stored) {
      return { success: false, id: noteId, rejected: 'stale' };
    }
  }
  const hasTitle = body.title !== undefined;
  const hasContent = body.content !== undefined;
  const hasFolder = body.folder !== undefined;
  const hasPinned = body.is_pinned !== undefined;
  const hasLocked = body.is_locked !== undefined;
  const hasLockHash = body.lock_password_hash !== undefined;
  const hasTrashed = body.is_trashed !== undefined;
  const hasTags = body.tags !== undefined;
  const titleVal = hasTitle ? sanitizeServerTitle(body.title) : null;
  const contentVal = hasContent ? sanitizeServerContent(body.content) : null;
  const folderVal = hasFolder ? sanitizeServerPlain(body.folder, 100) || 'Notes' : null;
  const isPinnedVal = hasPinned ? body.is_pinned : null;
  const isLockedVal = hasLocked ? body.is_locked : null;
  const lockHashVal = hasLockHash ? body.lock_password_hash : null;
  const isTrashedVal = hasTrashed ? body.is_trashed : null;
  const tagsVal = hasTags ? JSON.stringify(parseTags(body.tags)) : null;
  let blobUrl: string | null = null;
  let clearBlob = false;
  if (hasContent) {
    const oldRow = (await sql`SELECT blob_url FROM admin_notes WHERE id = ${noteId} LIMIT 1`) as {
      blob_url?: string | null;
    }[];
    if (typeof contentVal === 'string' && contentVal.length > 0) {
      blobUrl = await putNoteBlob(user.id, noteId, contentVal);
      if (blobUrl && oldRow.length > 0 && oldRow[0].blob_url && oldRow[0].blob_url !== blobUrl) {
        await deleteNoteBlobs([oldRow[0].blob_url]);
      }
    } else if (typeof contentVal === 'string' && contentVal.length === 0) {
      if (oldRow.length > 0 && oldRow[0].blob_url) {
        await deleteNoteBlobs([oldRow[0].blob_url]);
        clearBlob = true;
      }
    }
  }
  const hasBlob = blobUrl !== null;
  if (user.role === 'admin') {
    await sql`
      UPDATE admin_notes
      SET
        user_id = ${user.id},
        title = CASE WHEN ${hasTitle} THEN ${titleVal} ELSE title END,
        content = CASE WHEN ${hasBlob} THEN '' WHEN ${hasContent} THEN ${contentVal} ELSE content END,
        folder = CASE WHEN ${hasFolder} THEN ${folderVal} ELSE folder END,
        is_pinned = CASE WHEN ${hasPinned} THEN ${isPinnedVal} ELSE is_pinned END,
        is_locked = CASE WHEN ${hasLocked} THEN ${isLockedVal} ELSE is_locked END,
        lock_password_hash = CASE WHEN ${hasLockHash} THEN ${lockHashVal} ELSE lock_password_hash END,
        is_trashed = CASE WHEN ${hasTrashed} THEN ${isTrashedVal} ELSE is_trashed END,
        tags = CASE WHEN ${hasTags} THEN ${tagsVal} ELSE tags END,
        blob_url = CASE WHEN ${hasBlob} THEN ${blobUrl} WHEN ${clearBlob} THEN NULL ELSE blob_url END,
        updated_at = NOW()
      WHERE id = ${noteId} AND (user_id = ${user.id} OR user_id IS NULL)
    `;
  } else {
    await sql`
      UPDATE admin_notes
      SET
        title = CASE WHEN ${hasTitle} THEN ${titleVal} ELSE title END,
        content = CASE WHEN ${hasBlob} THEN '' WHEN ${hasContent} THEN ${contentVal} ELSE content END,
        folder = CASE WHEN ${hasFolder} THEN ${folderVal} ELSE folder END,
        is_pinned = CASE WHEN ${hasPinned} THEN ${isPinnedVal} ELSE is_pinned END,
        is_locked = CASE WHEN ${hasLocked} THEN ${isLockedVal} ELSE is_locked END,
        lock_password_hash = CASE WHEN ${hasLockHash} THEN ${lockHashVal} ELSE lock_password_hash END,
        is_trashed = CASE WHEN ${hasTrashed} THEN ${isTrashedVal} ELSE is_trashed END,
        tags = CASE WHEN ${hasTags} THEN ${tagsVal} ELSE tags END,
        blob_url = CASE WHEN ${hasBlob} THEN ${blobUrl} WHEN ${clearBlob} THEN NULL ELSE blob_url END,
        updated_at = NOW()
      WHERE id = ${noteId} AND user_id = ${user.id}
    `;
  }
  return { success: true, id: noteId };
}
