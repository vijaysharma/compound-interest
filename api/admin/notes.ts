import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  const sql = getDb();
  await ensureTables(sql);
  // Authenticate Admin
  const user = await getUserFromRequest(request, sql);
  if (!user || user.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized: Admin access required' }, 401);
  }
  if (request.method === 'GET') {
    try {
      const notes = await sql`
        SELECT id, content, created_at
        FROM admin_notes
        ORDER BY created_at DESC
        LIMIT 100
      `;
      return jsonResponse(notes);
    } catch (err) {
      return jsonResponse({ error: 'Failed to fetch notes', detail: String(err) }, 500);
    }
  }
  if (request.method === 'POST') {
    try {
      const body = (await request.json()) as { content?: string };
      const content = body?.content?.trim();
      if (!content) {
        return jsonResponse({ error: 'Content is required' }, 400);
      }
      const newId = crypto.randomUUID();
      await sql`
        INSERT INTO admin_notes (id, content, created_at, updated_at)
        VALUES (${newId}, ${content}, NOW(), NOW())
      `;
      return jsonResponse({ success: true, id: newId, content });
    } catch (err) {
      return jsonResponse({ error: 'Failed to create note', detail: String(err) }, 500);
    }
  }
  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      if (!id) {
        return jsonResponse({ error: 'Note ID is required' }, 400);
      }
      await sql`DELETE FROM admin_notes WHERE id = ${id}`;
      return jsonResponse({ success: true });
    } catch (err) {
      return jsonResponse({ error: 'Failed to delete note', detail: String(err) }, 500);
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405);
}
