import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { putNoteBlob } from '@/lib/blob';
import { CreateNoteInput, NoteItem } from './types';
import {
  parseTags,
  sanitizeServerContent,
  sanitizeServerId,
  sanitizeServerPlain,
  sanitizeServerTitle,
} from './sanitizeUtils';
export async function handleCreateNote(
  body: CreateNoteInput,
  token?: string | null
): Promise<NoteItem> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  if (!isPaidUser(user)) throw new Error('Pro subscription required');
  const id = sanitizeServerId(body.id);
  const title = sanitizeServerTitle(body.title);
  const content = sanitizeServerContent(body.content);
  const folder = sanitizeServerPlain(body.folder, 100) || 'Notes';
  const isPinned = Boolean(body.is_pinned);
  const isLocked = Boolean(body.is_locked);
  const lockHash = body.lock_password_hash || null;
  const isTrashed = Boolean(body.is_trashed);
  const tagsJson = JSON.stringify(parseTags(body.tags));
  const blobUrl = await putNoteBlob(user.id, id, content);
  const dbContent = blobUrl ? '' : content;
  await sql`
    INSERT INTO admin_notes (
      id, user_id, title, content, folder, is_pinned, is_locked, lock_password_hash, is_trashed, tags, blob_url, created_at, updated_at
    )
    VALUES (
      ${id}, ${user.id}, ${title}, ${dbContent}, ${folder}, ${isPinned}, ${isLocked}, ${lockHash}, ${isTrashed}, ${tagsJson}, ${blobUrl}, NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  return {
    id,
    title,
    content,
    folder,
    is_pinned: isPinned,
    is_locked: isLocked,
    lock_password_hash: lockHash || undefined,
    is_trashed: isTrashed,
    tags: parseTags(body.tags),
    blob_url: blobUrl || undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
