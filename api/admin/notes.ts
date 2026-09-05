import { ensureTables, getDb, getUserFromRequest, jsonResponse, isPaidUser } from '../_db';
export const config = { runtime: 'edge' };
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
  created_at: string;
  updated_at: string;
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
      const includeTrashed = url.searchParams.get('include_trashed') === 'true';
      const rows = (includeTrashed
        ? (user.role === 'admin'
            ? await sql`
                SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                       COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                       lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                       COALESCE(tags, '[]') AS tags, created_at, updated_at
                FROM admin_notes
                WHERE user_id = ${user.id} OR user_id IS NULL
                ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
                LIMIT 500
              `
            : await sql`
                SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                       COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                       lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                       COALESCE(tags, '[]') AS tags, created_at, updated_at
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
                       COALESCE(tags, '[]') AS tags, created_at, updated_at
                FROM admin_notes
                WHERE (is_trashed = FALSE OR is_trashed IS NULL) AND (user_id = ${user.id} OR user_id IS NULL)
                ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
                LIMIT 500
              `
            : await sql`
                SELECT id, COALESCE(title, '') AS title, content, COALESCE(folder, 'Notes') AS folder,
                       COALESCE(is_pinned, FALSE) AS is_pinned, COALESCE(is_locked, FALSE) AS is_locked,
                       lock_password_hash, COALESCE(is_trashed, FALSE) AS is_trashed,
                       COALESCE(tags, '[]') AS tags, created_at, updated_at
                FROM admin_notes
                WHERE (is_trashed = FALSE OR is_trashed IS NULL) AND user_id = ${user.id}
                ORDER BY is_pinned DESC, updated_at DESC, created_at DESC
                LIMIT 500
              `)) as NoteRow[];
      const formatted = rows.map((note) => ({
        id: note.id,
        title: note.title || '',
        content: note.content || '',
        folder: note.folder || 'Notes',
        is_pinned: Boolean(note.is_pinned),
        is_locked: Boolean(note.is_locked),
        lock_password_hash: note.lock_password_hash || undefined,
        is_trashed: Boolean(note.is_trashed),
        tags: parseTags(note.tags),
        created_at: note.created_at,
        updated_at: note.updated_at || note.created_at,
      }));
      return jsonResponse(formatted);
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
      // Check existing note
      const existing = (user.role === 'admin'
        ? await sql`SELECT id FROM admin_notes WHERE id = ${body.id} AND (user_id = ${user.id} OR user_id IS NULL) LIMIT 1`
        : await sql`SELECT id FROM admin_notes WHERE id = ${body.id} AND user_id = ${user.id} LIMIT 1`) as NoteRow[];
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
        await sql`
          INSERT INTO admin_notes (
            id, user_id, title, content, folder, is_pinned, is_locked, lock_password_hash, is_trashed, tags, created_at, updated_at
          )
          VALUES (
            ${body.id}, ${user.id}, ${title}, ${content}, ${folder}, ${isPinned}, ${isLocked}, ${lockHash}, ${isTrashed}, ${tagsJson}, NOW(), NOW()
          )
        `;
        return jsonResponse({ success: true, id: body.id });
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
      if (user.role === 'admin') {
        await sql`
          UPDATE admin_notes
          SET
            user_id = ${user.id},
            title = CASE WHEN ${hasTitle} THEN ${titleVal} ELSE title END,
            content = CASE WHEN ${hasContent} THEN ${contentVal} ELSE content END,
            folder = CASE WHEN ${hasFolder} THEN ${folderVal} ELSE folder END,
            is_pinned = CASE WHEN ${hasPinned} THEN ${isPinnedVal} ELSE is_pinned END,
            is_locked = CASE WHEN ${hasLocked} THEN ${isLockedVal} ELSE is_locked END,
            lock_password_hash = CASE WHEN ${hasLockHash} THEN ${lockHashVal} ELSE lock_password_hash END,
            is_trashed = CASE WHEN ${hasTrashed} THEN ${isTrashedVal} ELSE is_trashed END,
            tags = CASE WHEN ${hasTags} THEN ${tagsVal} ELSE tags END,
            updated_at = NOW()
          WHERE id = ${body.id} AND (user_id = ${user.id} OR user_id IS NULL)
        `;
      } else {
        await sql`
          UPDATE admin_notes
          SET
            title = CASE WHEN ${hasTitle} THEN ${titleVal} ELSE title END,
            content = CASE WHEN ${hasContent} THEN ${contentVal} ELSE content END,
            folder = CASE WHEN ${hasFolder} THEN ${folderVal} ELSE folder END,
            is_pinned = CASE WHEN ${hasPinned} THEN ${isPinnedVal} ELSE is_pinned END,
            is_locked = CASE WHEN ${hasLocked} THEN ${isLockedVal} ELSE is_locked END,
            lock_password_hash = CASE WHEN ${hasLockHash} THEN ${lockHashVal} ELSE lock_password_hash END,
            is_trashed = CASE WHEN ${hasTrashed} THEN ${isTrashedVal} ELSE is_trashed END,
            tags = CASE WHEN ${hasTags} THEN ${tagsVal} ELSE tags END,
            updated_at = NOW()
          WHERE id = ${body.id} AND user_id = ${user.id}
        `;
      }
      return jsonResponse({ success: true, id: body.id });
    } catch (err) {
      return jsonResponse({ error: 'Failed to update note', detail: String(err) }, 500);
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE: Delete note (soft or permanent) or empty trash
  // ─────────────────────────────────────────────────────────────────────────────
  if (request.method === 'DELETE') {
    try {
      const emptyTrash = url.searchParams.get('empty_trash') === 'true';
      if (emptyTrash) {
        if (user.role === 'admin') {
          await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND (user_id = ${user.id} OR user_id IS NULL)`;
        } else {
          await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND user_id = ${user.id}`;
        }
        return jsonResponse({ success: true, message: 'Trash emptied successfully' });
      }
      const id = url.searchParams.get('id');
      if (!id) {
        return jsonResponse({ error: 'Note ID is required' }, 400);
      }
      const permanent = url.searchParams.get('permanent') === 'true';
      if (permanent) {
        if (user.role === 'admin') {
          await sql`DELETE FROM admin_notes WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL)`;
        } else {
          await sql`DELETE FROM admin_notes WHERE id = ${id} AND user_id = ${user.id}`;
        }
        return jsonResponse({ success: true, deleted: true, permanent: true });
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
