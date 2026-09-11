const blobCache = new Map<string, string>();
export async function uploadToVercelBlob(
  userId: string,
  noteId: string,
  content: string
): Promise<string | null> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !content) return null;
  const pathname = `notes/${userId}/${noteId}.txt`;
  const uploadUrl = `https://blob.vercel-storage.com/${pathname}`;
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
      const errData = (await res.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
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
export async function fetchBlobContent(url: string): Promise<string | null> {
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
export async function deleteFromVercelBlob(
  urls: (string | null | undefined)[]
): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  const validUrls = urls.filter(
    (u): u is string => typeof u === 'string' && u.startsWith('http')
  );
  if (validUrls.length === 0) return;
  for (const u of validUrls) {
    blobCache.delete(u);
  }
  try {
    const res = await fetch('https://blob.vercel-storage.com/delete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-api-version': '7',
      },
      body: JSON.stringify({ urls: validUrls }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.warn('Vercel Blob deletion HTTP error:', res.status, err);
    }
  } catch (err) {
    console.warn('Vercel Blob deletion failed:', err);
  }
}
