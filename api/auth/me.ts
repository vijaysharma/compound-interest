import { ensureTables, getDb, getUserFromRequest, jsonResponse } from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const user = await getUserFromRequest(request, sql);
    if (!user) {
      return jsonResponse({ error: 'Unauthenticated' }, 401);
    }
    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to authenticate user', detail: String(error) }, 500);
  }
}
