'use server';
import { getDb, ensureTables, getUserFromToken } from '@/lib/db';
const ALIAS_MIN = 3;
const ALIAS_MAX = 24;
const ALIAS_RE = /^[a-zA-Z0-9_-]+$/;
export async function checkAliasAvailabilityAction(
  token: string,
  alias: string
): Promise<{ available: boolean; error?: string }> {
  const trimmed = alias.trim();
  if (trimmed.length < ALIAS_MIN) return { available: false, error: `Min ${ALIAS_MIN} characters` };
  if (trimmed.length > ALIAS_MAX) return { available: false, error: `Max ${ALIAS_MAX} characters` };
  if (!ALIAS_RE.test(trimmed)) return { available: false, error: 'Only letters, numbers, _ and -' };
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) return { available: false, error: 'Not authenticated' };
  const rows = (await sql`SELECT 1 FROM users WHERE LOWER(user_alias) = LOWER(${trimmed}) AND id != ${user.id} LIMIT 1`) as Array<unknown>;
  return { available: rows.length === 0 };
}
export async function updateUserAliasAction(
  token: string,
  alias: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = alias.trim();
  if (trimmed.length < ALIAS_MIN) return { success: false, error: `Min ${ALIAS_MIN} characters` };
  if (trimmed.length > ALIAS_MAX) return { success: false, error: `Max ${ALIAS_MAX} characters` };
  if (!ALIAS_RE.test(trimmed)) return { success: false, error: 'Only letters, numbers, _ and -' };
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) return { success: false, error: 'Not authenticated' };
  const existing = (await sql`SELECT 1 FROM users WHERE LOWER(user_alias) = LOWER(${trimmed}) AND id != ${user.id} LIMIT 1`) as Array<unknown>;
  if (existing.length > 0) return { success: false, error: 'Alias already taken' };
  try {
    await sql`UPDATE users SET user_alias = ${trimmed}, updated_at = NOW() WHERE id = ${user.id}`;
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update alias' };
  }
}
export async function getUserAliasAction(
  token: string
): Promise<{ alias: string | null }> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) return { alias: null };
  const rows = await sql`SELECT user_alias FROM users WHERE id = ${user.id}` as Array<{ user_alias: string | null }>;
  return { alias: rows[0]?.user_alias ?? null };
}
