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
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  try {
    const sql = getDb();
    await ensureTables(sql);
    const user = await getUserFromRequest(request, sql);
    if (!user) {
      return jsonResponse({ error: 'Unauthenticated' }, 401);
    }
    if (isUserBlocked(user)) {
      return jsonResponse(
        {
          error:
            'Free trial limit reached. Please unlock unlimited access for ₹19/month using UPI.',
          isBlocked: true,
          api_usage_count: user.api_usage_count ?? 0,
          freeLimit: FREE_USAGE_LIMIT,
        },
        402
      );
    }
    if (user.role !== 'admin') {
      const updated = (await sql`
        UPDATE users
        SET api_usage_count = api_usage_count + 1,
            updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING api_usage_count, subscription_status, subscription_expires_at, role
      `) as { api_usage_count: number; subscription_status: 'free_trial' | 'active' | 'expired'; subscription_expires_at: string | null; role: 'admin' | 'user' }[];
      if (updated.length > 0) {
        user.api_usage_count = updated[0].api_usage_count;
      }
    }
    const blocked = isUserBlocked(user);
    return jsonResponse({
      success: true,
      api_usage_count: user.api_usage_count ?? 0,
      isBlocked: blocked,
      freeLimit: FREE_USAGE_LIMIT,
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to record usage', detail: String(error) }, 500);
  }
}
