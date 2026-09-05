import { del } from '@vercel/blob';
import { ensureTables, getDb, getUserFromRequest, jsonResponse, isPaidUser } from '../_db';
export const config = { runtime: 'edge' };
declare const process: { env: Record<string, string | undefined> };
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
async function uploadToVercelBlob(userId: string, noteId: string, content: string): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !content) return null;
  const pathname = `notes/${userId}/${noteId}.txt`;
  const uploadUrl = `https://blob.vercel-storage.com/${pathname}`;
  // Modern Vercel stores default to private; try private first, then public fallback
  for (const access of ['private', 'public'] as const) {
    try {
      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'x-api-version': '7',
          'x-vercel-blob-access': access,
          'x-add-random-suffix': '1',
          'x-content-type': 'text/plain; charset=utf-8',
        },
        body: content,
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        return data.url || null;
      }
      const errData = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      if (errData?.error?.message?.includes('access')) {
        continue;
      }
      console.warn('Vercel Blob upload error:', res.status, errData);
      break;
    } catch (err) {
      console.warn('Vercel Blob upload failed:', err);
    }
  }
  return null;
}
const blobCache = new Map<string, string>();
async function fetchBlobContent(url: string): Promise<string | null> {
  if (blobCache.has(url)) {
    return blobCache.get(url)!;
  }
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const res = await fetch(url, {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) {
      const text = await res.text();
      if (blobCache.size > 500) {
        const first = blobCache.keys().next().value;
        if (first) blobCache.delete(first);
      }
      blobCache.set(url, text);
      return text;
    }
    console.warn('Vercel Blob fetch error status:', res.status);
    return null;
  } catch (err) {
    console.warn('Vercel Blob fetch exception:', err);
    return null;
  }
}
async function deleteFromVercelBlob(urls: (string | null | undefined)[]): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  const validUrls = urls.filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
  if (validUrls.length === 0) return;
  for (const u of validUrls) {
    blobCache.delete(u);
  }
  try {
    await del(validUrls, { token });
  } catch (err) {
    console.warn('Vercel Blob deletion failed:', err);
  }
}
function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((t) => typeof t === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((t) => typeof t === 'string');
    } catch {
      return [];
    }
  }
  return [];
}
export default async function handler(request: Request): Promise<Response> {
  const sql = getDb();
  await ensureTables(sql);
  // Authenticate user & verify paid status or admin role
  const user = await getUserFromRequest(request, sql);
  if (!user) {
    return jsonResponse({ error: 'Authentication required' }, 401);
  }
  if (!isPaidUser(user)) {
    return jsonResponse({ error: 'Pro subscription required' }, 403);
  }
  // If admin, backfill any legacy notes without user_id
  if (user.role === 'admin') {
    try {
      await sql`UPDATE admin_notes SET user_id = ${user.id} WHERE user_id IS NULL`;
    } catch {
      // ignore
    }
  }
  const url = new URL(request.url);
  // ─────────────────────────────────────────────────────────────────────────────
  // GET: Fetch notes
  // ─────────────────────────────────────────────────────────────────────────────
  if (request.method === 'GET') {
    try {
      if (url.searchParams.get('action') === 'storage_status') {
        const isBlobActive = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
        return jsonResponse({
          vercel_blob_enabled: isBlobActive,
          storage_provider: isBlobActive ? 'vercel_blob' : 'database_fallback',
          message: isBlobActive
            ? 'Vercel Blob storage is active. Notes are stored in Vercel Blob and offloaded from database.'
            : 'BLOB_READ_WRITE_TOKEN is not configured in environment variables. Notes are temporarily saved in the PostgreSQL database.',
        });
      }
      const includeTrashed = url.searchParams.get('include_trashed') === 'true';
      const rows = (includeTrashed
        ? (user.role === 'admin'
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
              `)
        : (user.role === 'admin'
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
              `)) as NoteRow[];
      // If any notes were offloaded to blob, fetch content in parallel
      const formatted = await Promise.all(
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
      // Auto-migrate legacy DB content to Vercel Blob in background if token is active
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        for (const n of rows) {
          if (n.content && !n.blob_url) {
            uploadToVercelBlob(user.id, n.id, n.content).then(async (bUrl) => {
              if (bUrl) {
                await sql`UPDATE admin_notes SET content = '', blob_url = ${bUrl} WHERE id = ${n.id}`;
              }
            }).catch(() => {});
          }
        }
      }
      const isBlobActive = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
      return new Response(JSON.stringify(formatted), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
          'x-storage-provider': isBlobActive ? 'vercel_blob' : 'database_fallback',
        },
      });
    } catch (err) {
      return jsonResponse({ error: 'Failed to fetch notes', detail: String(err) }, 500);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // POST: Create a new note
  // ─────────────────────────────────────────────────────────────────────────────
  if (request.method === 'POST') {
    try {
      const isRestore = url.searchParams.get('action') === 'restore_backup';
      if (isRestore) {
        const body = (await request.json()) as {
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
        };
        const backupNotes = Array.isArray(body?.notes) ? body.notes : [];
        if (backupNotes.length === 0) {
          return jsonResponse({ error: 'No notes provided in backup' }, 400);
        }
        if (body.replace) {
          const oldRows = (user.role === 'admin'
            ? await sql`SELECT blob_url FROM admin_notes WHERE user_id = ${user.id} OR user_id IS NULL`
            : await sql`SELECT blob_url FROM admin_notes WHERE user_id = ${user.id}`) as { blob_url?: string | null }[];
          const oldBlobs = oldRows.map((r) => r.blob_url).filter((u): u is string => typeof u === 'string' && Boolean(u));
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
          const id = n.id?.trim() || crypto.randomUUID();
          const title = n.title?.trim() || '';
          const content = n.content ?? '';
          const folder = n.folder?.trim() || 'Notes';
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
        return jsonResponse({ success: true, count });
      }
      const body = (await request.json()) as {
        id?: string;
        title?: string;
        content?: string;
        folder?: string;
        is_pinned?: boolean;
        is_locked?: boolean;
        lock_password_hash?: string;
        is_trashed?: boolean;
        tags?: string[];
      };
      const id = body.id?.trim() || crypto.randomUUID();
      const title = body.title?.trim() || '';
      const content = body.content ?? '';
      const folder = body.folder?.trim() || 'Notes';
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
      return jsonResponse({
        success: true,
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
      });
    } catch (err) {
      return jsonResponse({ error: 'Failed to create note', detail: String(err) }, 500);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // PUT / PATCH: Update existing note
  // ─────────────────────────────────────────────────────────────────────────────
  if (request.method === 'PUT' || request.method === 'PATCH') {
    try {
      const body = (await request.json()) as {
        id: string;
        title?: string;
        content?: string;
        folder?: string;
        is_pinned?: boolean;
        is_locked?: boolean;
        lock_password_hash?: string | null;
        is_trashed?: boolean;
        tags?: string[];
      };
      if (!body?.id) {
        return jsonResponse({ error: 'Note ID is required' }, 400);
      }
      const noteId: string = body.id;
      // Check existing note
      const existing = (user.role === 'admin'
        ? await sql`SELECT id FROM admin_notes WHERE id = ${noteId} AND (user_id = ${user.id} OR user_id IS NULL) LIMIT 1`
        : await sql`SELECT id FROM admin_notes WHERE id = ${noteId} AND user_id = ${user.id} LIMIT 1`) as NoteRow[];
      if (existing.length === 0) {
        // Upsert if not found
        const title = body.title || '';
        const content = body.content || '';
        const folder = body.folder || 'Notes';
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
        return jsonResponse({ success: true, id: noteId });
      }
      // Update fields
      const hasTitle = body.title !== undefined;
      const hasContent = body.content !== undefined;
      const hasFolder = body.folder !== undefined;
      const hasPinned = body.is_pinned !== undefined;
      const hasLocked = body.is_locked !== undefined;
      const hasLockHash = body.lock_password_hash !== undefined;
      const hasTrashed = body.is_trashed !== undefined;
      const hasTags = body.tags !== undefined;
      const titleVal = hasTitle ? body.title : null;
      const contentVal = hasContent ? body.content : null;
      const folderVal = hasFolder ? body.folder : null;
      const isPinnedVal = hasPinned ? body.is_pinned : null;
      const isLockedVal = hasLocked ? body.is_locked : null;
      const lockHashVal = hasLockHash ? body.lock_password_hash : null;
      const isTrashedVal = hasTrashed ? body.is_trashed : null;
      const tagsVal = hasTags ? JSON.stringify(parseTags(body.tags)) : null;
      let blobUrl: string | null = null;
      let clearBlob = false;
      if (hasContent) {
        const oldRow = (await sql`SELECT blob_url FROM admin_notes WHERE id = ${noteId} LIMIT 1`) as { blob_url?: string | null }[];
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
      return jsonResponse({ success: true, id: noteId });
    } catch (err) {
      return jsonResponse({ error: 'Failed to update note', detail: String(err) }, 500);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE: Delete note (soft or permanent) or empty trash
  // ─────────────────────────────────────────────────────────────────────────────
  if (request.method === 'DELETE') {
    try {
      const emptyTrash =
        url.searchParams.get('empty_trash') === 'true' ||
        url.searchParams.get('action') === 'empty_trash';
      if (emptyTrash) {
        const trashedRows = (user.role === 'admin'
          ? await sql`SELECT id, blob_url FROM admin_notes WHERE is_trashed = TRUE AND (user_id = ${user.id} OR user_id IS NULL)`
          : await sql`SELECT id, blob_url FROM admin_notes WHERE is_trashed = TRUE AND user_id = ${user.id}`) as { id: string; blob_url?: string | null }[];
        const blobUrls = trashedRows.map((r) => r.blob_url).filter(Boolean);
        if (blobUrls.length > 0) {
          await deleteFromVercelBlob(blobUrls);
        }
        if (user.role === 'admin') {
          await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND (user_id = ${user.id} OR user_id IS NULL)`;
        } else {
          await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND user_id = ${user.id}`;
        }
        return jsonResponse({
          success: true,
          count: trashedRows.length,
          message: 'Trash emptied and notes permanently removed from database',
        });
      }
      const id = url.searchParams.get('id');
      if (!id) {
        return jsonResponse({ error: 'Note ID is required' }, 400);
      }
      const permanent = url.searchParams.get('permanent') === 'true';
      const existing = (user.role === 'admin'
        ? await sql`SELECT id, is_trashed, blob_url FROM admin_notes WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL) LIMIT 1`
        : await sql`SELECT id, is_trashed, blob_url FROM admin_notes WHERE id = ${id} AND user_id = ${user.id} LIMIT 1`) as { id: string; is_trashed?: boolean | null; blob_url?: string | null }[];
      if (existing.length === 0) {
        return jsonResponse({ success: true, deleted: true, message: 'Note not found or already deleted' });
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
        return jsonResponse({
          success: true,
          deleted: true,
          permanent: true,
          message: 'Note permanently removed from database',
        });
      }
      // Soft delete -> move to trash
      if (user.role === 'admin') {
        await sql`UPDATE admin_notes SET is_trashed = TRUE, updated_at = NOW() WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL)`;
      } else {
        await sql`UPDATE admin_notes SET is_trashed = TRUE, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
      }
      return jsonResponse({ success: true, trashed: true });
    } catch (err) {
      return jsonResponse({ error: 'Failed to delete note', detail: String(err) }, 500);
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
