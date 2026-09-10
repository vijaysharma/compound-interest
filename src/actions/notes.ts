'use server';
import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { deleteFromVercelBlob, fetchBlobContent, uploadToVercelBlob } from '@/lib/blob';
interface NoteRow {
  id: string;
  user_id?: string | null;
  title: string | null;
  content: string;
  folder: string | null;
  is_pinned: boolean | null;
  is_locked: boolean | null;
  lock_password_hash: string | null;
  is_trashed: boolean | null;
  tags: string | null;
  blob_url?: string | null;
  created_at: string;
  updated_at: string;
}
export interface NoteItem {
  id: string;
  title: string;
  content: string;
  folder: string;
  is_pinned: boolean;
  is_locked: boolean;
  lock_password_hash?: string;
  is_trashed: boolean;
  tags: string[];
  blob_url?: string;
  created_at: string;
  updated_at: string;
}
function sanitizeServerContent(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  if (raw.startsWith('e2e:v1:')) {
    return raw.length > 10_000_000 ? raw.slice(0, 10_000_000) : raw;
  }
  const content = raw.length > 5_000_000 ? raw.slice(0, 5_000_000) : raw;
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/href\s*=\s*['"]?(?:javascript|data|vbscript):[^'">\s]*/gi, 'href="#"');
}
function sanitizeServerTitle(input: unknown): string {
  if (typeof input !== 'string') return '';
  if (input.startsWith('e2e:v1:')) {
    return input.slice(0, 4000);
  }
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 250);
}
function sanitizeServerPlain(input: unknown, maxLen = 250): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLen);
}
function sanitizeServerId(id: unknown): string {
  if (typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id.trim())) {
    return id.trim();
  }
  return crypto.randomUUID();
}
function parseTags(raw: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      return [];
    }
  }
  return list
    .filter((t): t is string => typeof t === 'string')
    .map((t) => (t as string).replace(/[^\w-]/g, '').slice(0, 50).toLowerCase())
    .filter(Boolean)
    .slice(0, 30);
}
export async function getNotesAction(
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
      let noteContent = note.content || '';
      if (!noteContent && note.blob_url) {
        noteContent = (await fetchBlobContent(note.blob_url)) || '';
      }
      return {
        id: note.id,
        title: note.title || '',
        content: noteContent,
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
export async function createNoteAction(
  body: {
    id?: string;
    title?: string;
    content?: string;
    folder?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
    lock_password_hash?: string;
    is_trashed?: boolean;
    tags?: string[];
  },
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
  const blobUrl = await uploadToVercelBlob(user.id, id, content);
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
export async function updateNoteAction(
  body: {
    id: string;
    title?: string;
    content?: string;
    folder?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
    lock_password_hash?: string | null;
    is_trashed?: boolean;
    tags?: string[];
  },
  token?: string | null
): Promise<{ success: boolean; id: string }> {
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
    ? await sql`SELECT id FROM admin_notes WHERE id = ${noteId} AND (user_id = ${user.id} OR user_id IS NULL) LIMIT 1`
    : await sql`SELECT id FROM admin_notes WHERE id = ${noteId} AND user_id = ${user.id} LIMIT 1`) as NoteRow[];
  if (existing.length === 0) {
    const title = sanitizeServerTitle(body.title);
    const content = sanitizeServerContent(body.content);
    const folder = sanitizeServerPlain(body.folder, 100) || 'Notes';
    const isPinned = Boolean(body.is_pinned);
    const isLocked = Boolean(body.is_locked);
    const lockHash = body.lock_password_hash || null;
    const isTrashed = Boolean(body.is_trashed);
    const tagsJson = JSON.stringify(parseTags(body.tags));
    const blobUrl = await uploadToVercelBlob(user.id, noteId, content);
    const dbContent = blobUrl ? '' : content;
    await sql`
      INSERT INTO admin_notes (
        id, user_id, title, content, folder, is_pinned, is_locked, lock_password_hash, is_trashed, tags, blob_url, created_at, updated_at
      )
      VALUES (
        ${noteId}, ${user.id}, ${title}, ${dbContent}, ${folder}, ${isPinned}, ${isLocked}, ${lockHash}, ${isTrashed}, ${tagsJson}, ${blobUrl}, NOW(), NOW()
      )
    `;
    return { success: true, id: noteId };
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
      blobUrl = await uploadToVercelBlob(user.id, noteId, contentVal);
      if (blobUrl && oldRow.length > 0 && oldRow[0].blob_url && oldRow[0].blob_url !== blobUrl) {
        await deleteFromVercelBlob([oldRow[0].blob_url]);
      }
    } else if (typeof contentVal === 'string' && contentVal.length === 0) {
      if (oldRow.length > 0 && oldRow[0].blob_url) {
        await deleteFromVercelBlob([oldRow[0].blob_url]);
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
export async function deleteNoteAction(
  options: { id?: string; permanent?: boolean },
  token?: string | null
): Promise<{ success: boolean; trashed?: boolean; deleted?: boolean; message?: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  if (!isPaidUser(user)) throw new Error('Pro subscription required');
  const { id, permanent } = options;
  if (!id) throw new Error('Note ID is required');
  const existing = (user.role === 'admin'
    ? await sql`SELECT id, is_trashed, blob_url FROM admin_notes WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL) LIMIT 1`
    : await sql`SELECT id, is_trashed, blob_url FROM admin_notes WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`) as {
    id: string;
    is_trashed?: boolean | null;
    blob_url?: string | null;
  }[];
  if (existing.length === 0) {
    return { success: true, deleted: true, message: 'Note not found or already deleted' };
  }
  const shouldPermanentlyDelete = permanent || Boolean(existing[0].is_trashed);
  if (shouldPermanentlyDelete) {
    if (existing[0].blob_url) {
      await deleteFromVercelBlob([existing[0].blob_url]);
    }
    if (user.role === 'admin') {
      await sql`DELETE FROM admin_notes WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL)`;
    } else {
      await sql`DELETE FROM admin_notes WHERE id = ${id} AND user_id = ${user.id}`;
    }
    return { success: true, deleted: true, message: 'Note permanently removed from database' };
  }
  if (user.role === 'admin') {
    await sql`UPDATE admin_notes SET is_trashed = TRUE, updated_at = NOW() WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL)`;
  } else {
    await sql`UPDATE admin_notes SET is_trashed = TRUE, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
  }
  return { success: true, trashed: true };
}
export async function emptyTrashAction(
  token?: string | null
): Promise<{ success: boolean; count: number; message: string }> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  if (!isPaidUser(user)) throw new Error('Pro subscription required');
  const trashedRows = (user.role === 'admin'
    ? await sql`SELECT id, blob_url FROM admin_notes WHERE is_trashed = TRUE AND (user_id = ${user.id} OR user_id IS NULL)`
    : await sql`SELECT id, blob_url FROM admin_notes WHERE is_trashed = TRUE AND user_id = ${user.id}`) as {
    id: string;
    blob_url?: string | null;
  }[];
  const blobUrls = trashedRows.map((r) => r.blob_url).filter(Boolean);
  if (blobUrls.length > 0) {
    await deleteFromVercelBlob(blobUrls);
  }
  if (user.role === 'admin') {
    await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND (user_id = ${user.id} OR user_id IS NULL)`;
  } else {
    await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND user_id = ${user.id}`;
  }
  return {
    success: true,
    count: trashedRows.length,
    message: 'Trash emptied and notes permanently removed from database',
  };
}
export async function restoreNotesBackupAction(
  body: {
    notes: Array<{
      id?: string;
      title?: string;
      content?: string;
      folder?: string;
      is_pinned?: boolean;
      is_locked?: boolean;
      lock_password_hash?: string;
      is_trashed?: boolean;
      tags?: string[];
    }>;
    replace?: boolean;
  },
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
      await deleteFromVercelBlob(oldBlobs);
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
    await sql`
      INSERT INTO admin_notes (
        id, user_id, title, content, folder, is_pinned, is_locked, lock_password_hash, is_trashed, tags, created_at, updated_at
      )
      VALUES (
        ${id}, ${user.id}, ${title}, ${content}, ${folder}, ${isPinned}, ${isLocked}, ${lockHash}, ${isTrashed}, ${tagsJson}, NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
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
export async function getNotesStorageStatusAction(): Promise<{
  vercel_blob_enabled: boolean;
  storage_provider: string;
  message: string;
}> {
  const isBlobActive = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  return {
    vercel_blob_enabled: isBlobActive,
    storage_provider: isBlobActive ? 'vercel_blob' : 'database_fallback',
    message: isBlobActive
      ? 'Vercel Blob storage is active. Notes are stored in Vercel Blob and offloaded from database.'
      : 'BLOB_READ_WRITE_TOKEN is not configured in environment variables. Notes are temporarily saved in the PostgreSQL database.',
  };
}
