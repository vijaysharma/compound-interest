'use server';
import { ensureTables, getDb, getUserFromToken } from '@/lib/db';
const MAX_PAYLOAD_SIZE = 512 * 1024;
export async function saveUserAppStateAction(
  token: string | null | undefined,
  guestId: string | null | undefined,
  namespace: string,
  stateKey: string,
  payload: unknown
): Promise<{ success: boolean; error?: string }> {
  const sql = getDb();
  await ensureTables(sql);
  let effectiveUserId = '';
  if (token) {
    const user = await getUserFromToken(token, sql);
    if (user?.id) {
      effectiveUserId = `user_${user.id}`;
    }
  }
  if (!effectiveUserId && guestId) {
    effectiveUserId = `guest_${guestId.slice(0, 48)}`;
  }
  if (!effectiveUserId) {
    return { success: false, error: 'No user or guest identifier' };
  }
  const serialized = JSON.stringify(payload);
  if (serialized.length > MAX_PAYLOAD_SIZE) {
    return { success: false, error: 'Payload size exceeds limit' };
  }
  const cleanNamespace = namespace.slice(0, 32);
  const cleanKey = stateKey.slice(0, 64);
  await sql`
    INSERT INTO user_app_state (user_id, namespace, state_key, payload, updated_at)
    VALUES (${effectiveUserId}, ${cleanNamespace}, ${cleanKey}, ${serialized}::jsonb, NOW())
    ON CONFLICT (user_id, namespace, state_key)
    DO UPDATE SET payload = ${serialized}::jsonb, updated_at = NOW()
  `;
  return { success: true };
}
export async function getUserAppStateAction<T = unknown>(
  token: string | null | undefined,
  guestId: string | null | undefined,
  namespace: string,
  stateKey: string
): Promise<{ success: boolean; payload?: T; updatedAt?: string }> {
  const sql = getDb();
  await ensureTables(sql);
  let effectiveUserId = '';
  if (token) {
    const user = await getUserFromToken(token, sql);
    if (user?.id) {
      effectiveUserId = `user_${user.id}`;
    }
  }
  if (!effectiveUserId && guestId) {
    effectiveUserId = `guest_${guestId.slice(0, 48)}`;
  }
  if (!effectiveUserId) {
    return { success: false };
  }
  const cleanNamespace = namespace.slice(0, 32);
  const cleanKey = stateKey.slice(0, 64);
  const rows = (await sql`
    SELECT payload, updated_at::text AS updated_at
    FROM user_app_state
    WHERE user_id = ${effectiveUserId} AND namespace = ${cleanNamespace} AND state_key = ${cleanKey}
  `) as Array<{ payload: T; updated_at: string }>;
  if (rows.length === 0) {
    return { success: false };
  }
  return {
    success: true,
    payload: rows[0].payload,
    updatedAt: rows[0].updated_at,
  };
}
