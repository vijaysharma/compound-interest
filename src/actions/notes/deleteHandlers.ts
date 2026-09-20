import {
  ensureTables,
  getDb,
  getUserFromToken,
  isPaidUser,
} from '@/lib/db';
import { deleteNoteBlobs } from '@/lib/blob';
export async function handleDeleteNote(
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
    let blobRemoved = true;
    if (existing[0].blob_url) {
      blobRemoved = await deleteNoteBlobs([existing[0].blob_url]);
    }
    if (user.role === 'admin') {
      await sql`DELETE FROM admin_notes WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL)`;
    } else {
      await sql`DELETE FROM admin_notes WHERE id = ${id} AND user_id = ${user.id}`;
    }
    return {
      success: true,
      deleted: true,
      message: blobRemoved
        ? 'Note permanently removed from database and blob storage'
        : 'Note removed from database, but its blob could not be deleted',
    };
  }
  if (user.role === 'admin') {
    await sql`UPDATE admin_notes SET is_trashed = TRUE, updated_at = NOW() WHERE id = ${id} AND (user_id = ${user.id} OR user_id IS NULL)`;
  } else {
    await sql`UPDATE admin_notes SET is_trashed = TRUE, updated_at = NOW() WHERE id = ${id} AND user_id = ${user.id}`;
  }
  return { success: true, trashed: true };
}
export async function handleEmptyTrash(
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
  let blobsRemoved = true;
  if (blobUrls.length > 0) {
    blobsRemoved = await deleteNoteBlobs(blobUrls);
  }
  if (user.role === 'admin') {
    await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND (user_id = ${user.id} OR user_id IS NULL)`;
  } else {
    await sql`DELETE FROM admin_notes WHERE is_trashed = TRUE AND user_id = ${user.id}`;
  }
  return {
    success: true,
    count: trashedRows.length,
    message: blobsRemoved
      ? 'Trash emptied and notes permanently removed from database and blob storage'
      : 'Trash emptied, but some blobs could not be deleted',
  };
}
