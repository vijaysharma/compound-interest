import {
  ensureTables,
  FREE_USAGE_LIMIT,
  getDb,
  getUserFromRequest,
  isUserBlocked,
  jsonResponse,
} from '../_db';
export const config = { runtime: 'edge' };
export default async function handler(request: Request): Promise<Response> {
  try {
    const sql = getDb();
    await ensureTables(sql);
    const user = await getUserFromRequest(request, sql);
    if (!user) {
      return jsonResponse({ error: 'Unauthenticated' }, 401);
    }
    const blocked = isUserBlocked(user);
    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        api_usage_count: user.api_usage_count ?? 0,
        subscription_status: user.subscription_status ?? 'free_trial',
        subscription_expires_at: user.subscription_expires_at,
        trial_expires_at: user.trial_expires_at,
        isBlocked: blocked,
        freeLimit: FREE_USAGE_LIMIT,
      },
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to authenticate user', detail: String(error) }, 500);
  }
}
