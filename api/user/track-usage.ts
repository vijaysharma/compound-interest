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
    let body: { type?: 'api' | 'init' } = {};
    try {
      body = (await request.json()) as { type?: 'api' | 'init' };
    } catch {
      // body empty or not json
    }
    const isInitOnly = body.type === 'init';
    const limit = user.free_limit ?? FREE_USAGE_LIMIT;
    const isTimeExpired =
      user.trial_expires_at && new Date(user.trial_expires_at).getTime() < Date.now();
    if (isUserBlocked(user, !isInitOnly)) {
      const message = isTimeExpired
        ? 'Your 48-hour free trial period has ended. Unlock 30 days unlimited Pro for ₹54.'
        : `Free trial limit of ${limit} live calculation runs reached. Unlock 30 days unlimited Pro for ₹54.`;
      return jsonResponse(
        {
          error: message,
          isBlocked: true,
          api_usage_count: user.api_usage_count ?? 0,
          freeLimit: limit,
          first_used_at: user.first_used_at,
          trial_expires_at: user.trial_expires_at,
        },
        402
      );
    }
    if (user.role !== 'admin') {
      const updated = (await sql`
        UPDATE users
        SET first_used_at = COALESCE(first_used_at, NOW()),
            trial_expires_at = COALESCE(trial_expires_at, NOW() + INTERVAL '48 hours'),
            api_usage_count = CASE WHEN ${isInitOnly} THEN api_usage_count ELSE api_usage_count + 1 END,
            updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING api_usage_count, free_limit, subscription_status, subscription_expires_at, first_used_at, trial_expires_at, role
      `) as {
        api_usage_count: number;
        free_limit: number;
        subscription_status: 'free_trial' | 'active' | 'expired';
        subscription_expires_at: string | null;
        first_used_at: string | null;
        trial_expires_at: string | null;
        role: 'admin' | 'user';
      }[];
      if (updated.length > 0) {
        user.api_usage_count = updated[0].api_usage_count;
        user.free_limit = updated[0].free_limit ?? limit;
        user.first_used_at = updated[0].first_used_at;
        user.trial_expires_at = updated[0].trial_expires_at;
      }
    }
    const blocked = isUserBlocked(user, !isInitOnly);
    return jsonResponse({
      success: true,
      api_usage_count: user.api_usage_count ?? 0,
      isBlocked: blocked,
      freeLimit: user.free_limit ?? limit,
      first_used_at: user.first_used_at,
      trial_expires_at: user.trial_expires_at,
    });
  } catch (error) {
    return jsonResponse({ error: 'Failed to record usage', detail: String(error) }, 500);
  }
}
