import type { Query } from '@/lib/db';
import type { MergeableStrategy, StrategyTombstone } from '@/utilities/strategyMerge';
export interface SyncedStrategy extends MergeableStrategy {
  config: unknown;
}
export interface StrategySyncPayload {
  entries: SyncedStrategy[];
  tombstones: StrategyTombstone[];
  activeId: string;
}
export const MAX_STRATEGIES = 20;
const MAX_CONFIG_BYTES = 256 * 1024;
const MAX_NAME_LENGTH = 60;
export type StrategyRow = {
  id: string;
  name: string;
  config: unknown;
  saved_at: string | null;
  is_active: boolean;
  updated_at_ms: string | number;
  deleted_at_ms: string | number | null;
};
export function sanitiseIncoming(payload: StrategySyncPayload | null | undefined): {
  entries: SyncedStrategy[];
  tombstones: StrategyTombstone[];
  activeId: string;
} {
  const entries: SyncedStrategy[] = [];
  for (const raw of Array.isArray(payload?.entries) ? payload.entries : []) {
    if (!raw || typeof raw.id !== 'string' || !raw.id) continue;
    if (raw.config === undefined || raw.config === null) continue;
    let serialised: string;
    try {
      serialised = JSON.stringify(raw.config);
    } catch {
      continue;
    }
    if (serialised.length > MAX_CONFIG_BYTES) continue;
    entries.push({
      id: raw.id.slice(0, 64),
      name: String(raw.name ?? '').slice(0, MAX_NAME_LENGTH) || 'Strategy',
      config: raw.config,
      savedAt: typeof raw.savedAt === 'string' ? raw.savedAt.slice(0, 10) : '',
      updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : 0,
    });
    if (entries.length >= MAX_STRATEGIES * 2) break;
  }
  const tombstones: StrategyTombstone[] = [];
  for (const raw of Array.isArray(payload?.tombstones) ? payload.tombstones : []) {
    if (!raw || typeof raw.id !== 'string' || !raw.id) continue;
    tombstones.push({
      id: raw.id.slice(0, 64),
      deletedAt: Number.isFinite(Number(raw.deletedAt)) ? Number(raw.deletedAt) : 0,
    });
    if (tombstones.length >= MAX_STRATEGIES * 4) break;
  }
  return {
    entries,
    tombstones,
    activeId: typeof payload?.activeId === 'string' ? payload.activeId.slice(0, 64) : '',
  };
}
export async function persistStrategies(
  sql: Query,
  userId: string,
  entries: SyncedStrategy[],
  tombstones: StrategyTombstone[],
  activeId: string
): Promise<void> {
  for (const entry of entries) {
    await sql`
      INSERT INTO user_strategies (id, user_id, name, config, saved_at, is_active, updated_at, deleted_at)
      VALUES (
        ${entry.id}, ${userId}, ${entry.name}, ${JSON.stringify(entry.config)}::jsonb,
        ${entry.savedAt || null}::date, ${entry.id === activeId},
        to_timestamp(${entry.updatedAt} / 1000.0), NULL
      )
      ON CONFLICT (user_id, id) DO UPDATE SET
        name = EXCLUDED.name, config = EXCLUDED.config, saved_at = EXCLUDED.saved_at,
        is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at, deleted_at = NULL
    `;
  }
  for (const stone of tombstones) {
    await sql`
      INSERT INTO user_strategies (id, user_id, name, config, updated_at, deleted_at)
      VALUES (
        ${stone.id}, ${userId}, '', '{}'::jsonb,
        to_timestamp(${stone.deletedAt} / 1000.0), to_timestamp(${stone.deletedAt} / 1000.0)
      )
      ON CONFLICT (user_id, id) DO UPDATE SET
        deleted_at = to_timestamp(${stone.deletedAt} / 1000.0),
        updated_at = to_timestamp(${stone.deletedAt} / 1000.0), config = '{}'::jsonb
    `;
  }
  const keep = [...entries.map((e) => e.id), ...tombstones.map((t) => t.id)];
  if (keep.length > 0) {
    await sql`DELETE FROM user_strategies WHERE user_id = ${userId} AND id <> ALL(${keep})`;
  }
}
