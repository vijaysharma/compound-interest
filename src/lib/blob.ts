import { del, get, put } from '@vercel/blob';
/**
 * Vercel Blob storage for Quick Notes bodies.
 *
 * Notes are written to a deterministic pathname (`notes/<userId>/<noteId>.txt`)
 * and overwritten in place, so a note's blob URL is stable for its lifetime.
 *
 * Blobs are written with `access: 'private'`, which means they can only be read
 * back through the SDK — a plain `fetch(url)` with the read/write token as a
 * bearer header is NOT authorized and returns 401/403. Always read via
 * `readNoteBlob`.
 *
 * There is deliberately no in-process content cache here. Because pathnames are
 * deterministic and overwritten, the same URL serves different content over
 * time, so a URL-keyed cache would hand back stale note bodies.
 */
function blobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}
export function isBlobConfigured(): boolean {
  return Boolean(blobToken());
}
function notePathname(userId: string, noteId: string): string {
  return `notes/${userId}/${noteId}.txt`;
}
/**
 * Uploads (or overwrites) a note body and returns its blob URL.
 * Returns null when blob storage is not configured or the upload fails, in
 * which case the caller must keep relying on the database copy.
 */
export async function putNoteBlob(
  userId: string,
  noteId: string,
  content: string
): Promise<string | null> {
  const token = blobToken();
  if (!token || !content) return null;
  try {
    const result = await put(notePathname(userId, noteId), content, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'text/plain; charset=utf-8',
      token,
    });
    return result.url || null;
  } catch (err) {
    console.warn('Vercel Blob upload failed:', err);
    return null;
  }
}
async function readViaSdk(
  url: string,
  access: 'private' | 'public',
  token: string
): Promise<string | null> {
  const result = await get(url, { access, token, useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return await new Response(result.stream).text();
}
/**
 * Reads a note body back from blob storage.
 *
 * Tries the private path first (how we write today), then public, then an
 * unauthenticated fetch — the last two cover blobs written by earlier versions
 * of this code, which uploaded with public access and random suffixes.
 */
export async function readNoteBlob(url: string): Promise<string | null> {
  const token = blobToken();
  if (!url) return null;
  if (token) {
    for (const access of ['private', 'public'] as const) {
      try {
        const text = await readViaSdk(url, access, token);
        if (text !== null) return text;
      } catch {
        // Wrong access mode or missing blob — fall through to the next attempt.
      }
    }
  }
  try {
    const res = await fetch(url);
    if (res.ok) return await res.text();
    console.warn('Vercel Blob fetch error status:', res.status, url);
  } catch (err) {
    console.warn('Vercel Blob fetch exception:', err);
  }
  return null;
}
/**
 * Deletes note blobs. Returns false if a delete was attempted and failed, so
 * callers can report an orphaned blob rather than leaving it unnoticed.
 */
export async function deleteNoteBlobs(
  urls: (string | null | undefined)[]
): Promise<boolean> {
  const token = blobToken();
  if (!token) return true;
  const validUrls = urls.filter(
    (u): u is string => typeof u === 'string' && u.startsWith('http')
  );
  if (validUrls.length === 0) return true;
  try {
    await del(validUrls, { token });
    return true;
  } catch (err) {
    console.error('Vercel Blob deletion failed, blob is now orphaned:', err);
    return false;
  }
}
