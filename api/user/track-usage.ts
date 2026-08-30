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
      const isTimeExpired =
        user.trial_expires_at && new Date(user.trial_expires_at).getTime() < Date.now();
      const message = isTimeExpired
        ? 'Your 24-hour free trial period for live Mutual Funds analytics has ended. Unlock 30 days unlimited Pro for ₹29.'
        : 'Free trial limit of 10 live Mutual Fund calculation runs reached. Unlock 30 days unlimited Pro for ₹29.';
      return jsonResponse(
        {
          error: message,
          isBlocked: true,
          api_usage_count: user.api_usage_count ?? 0,
          freeLimit: FREE_USAGE_LIMIT,
          trial_expires_at: user.trial_expires_at,
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
        RETURNING api_usage_count, subscription_status, subscription_expires_at, trial_expires_at, role
      `) as {
        api_usage_count: number;
        subscription_status: 'free_trial' | 'active' | 'expired';
        subscription_expires_at: string | null;
        trial_expires_at: string | null;
        role: 'admin' | 'user';
      }[];
      if (updated.length > 0) {
        user.api_usage_count = updated[0].api_usage_count;
        user.trial_expires_at = updated[0].trial_expires_at;
      }
    }
    const blocked = isUserBlocked(user);
    return jsonResponse({
      success: true,
      api_usage_count: user.api_usage_count ?? 0,
      isBlocked: blocked,
      freeLimit: FREE_USAGE_LIMIT,
      trial_expires_at: user.trial_expires_at,
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to record usage', detail: String(error) }, 500);
  }
}
