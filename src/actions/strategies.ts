'use server';
import { ensureTables, getDb, getUserFromToken } from '@/lib/db';
import { mergeStrategies, type StrategyTombstone } from '@/utilities/strategyMerge';
import {
  MAX_STRATEGIES,
  sanitiseIncoming,
  persistStrategies,
  type StrategyRow,
  type StrategySyncPayload,
  type SyncedStrategy,
} from './strategyPersistence';
export type { SyncedStrategy, StrategySyncPayload } from './strategyPersistence';
export async function syncStrategiesAction(
  token?: string | null,
  payload?: StrategySyncPayload
): Promise<StrategySyncPayload> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  const incoming = sanitiseIncoming(payload);
  const rows = (await sql`
    SELECT id, name, config, saved_at::text AS saved_at, is_active,
           (EXTRACT(EPOCH FROM updated_at) * 1000)::bigint AS updated_at_ms,
           (EXTRACT(EPOCH FROM deleted_at) * 1000)::bigint AS deleted_at_ms
    FROM user_strategies
    WHERE user_id = ${user.id}
  `) as StrategyRow[];
  const stored: SyncedStrategy[] = [];
  const storedTombstones: StrategyTombstone[] = [];
  let storedActiveId = '';
  for (const row of rows) {
    const deletedAt = row.deleted_at_ms === null ? null : Number(row.deleted_at_ms);
    if (deletedAt !== null) {
      storedTombstones.push({ id: row.id, deletedAt });
      continue;
    }
    stored.push({
      id: row.id,
      name: row.name,
      config: row.config,
      savedAt: row.saved_at ?? '',
      updatedAt: Number(row.updated_at_ms),
    });
    if (row.is_active) storedActiveId = row.id;
  }
  const storedIds = new Set(stored.map((s) => s.id));
  const hasKnownStoredStrategy = incoming.entries.some((e) => storedIds.has(e.id));
  // If the database already holds saved strategies, do not let an uninitialized client's
  // unedited default fallback strategy (e.g. "Strategy 1" with no fund picked) be merged in.
  const effectiveIncomingEntries = incoming.entries.filter((entry) => {
    if (stored.length > 0 && !hasKnownStoredStrategy) {
      const config = entry.config as Record<string, unknown> | null;
      const column1 = config?.column1 as Record<string, unknown> | null;
      const isDefaultPlaceholder =
        entry.name === 'Strategy 1' && (!column1?.fund || column1.fund === null);
      if (isDefaultPlaceholder) return false;
    }
    return true;
  });
  const merged = mergeStrategies(
    effectiveIncomingEntries,
    incoming.tombstones,
    stored,
    storedTombstones,
    MAX_STRATEGIES
  );
  const activeId = merged.entries.some((e) => e.id === incoming.activeId)
    ? incoming.activeId
    : merged.entries.some((e) => e.id === storedActiveId)
      ? storedActiveId
      : (merged.entries[0]?.id ?? '');
  try {
    await persistStrategies(sql, user.id, merged.entries, merged.tombstones, activeId);
  } catch (dbErr) {
    console.warn('[strategies] write failed:', dbErr);
    throw new Error('Could not save strategies');
  }
  return { entries: merged.entries, tombstones: merged.tombstones, activeId };
}
