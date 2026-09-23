'use server';
import { ensureTables, getDb, getUserFromToken } from '@/lib/db';
import {
  type MergeableStrategy,
  type StrategyTombstone,
  mergeStrategies,
} from '@/utilities/strategyMerge';
/**
 * Server side of strategy sync for /strategy-calculator.
 *
 * One call does the whole exchange: the browser sends everything it holds, the
 * server merges that against the stored rows and returns the reconciled set,
 * which the browser then adopts wholesale. A single round trip keeps the
 * client simple — it never has to reason about which side is authoritative —
 * and keeps the merge in one place, server-side, where every device sees the
 * same rules.
 *
 * Gated on being signed in and nothing more. The page itself is already behind
 * `ProtectedRoute`, so anybody who can reach it can save; requiring a
 * subscription here would break saving for users who can currently do it.
 */
export interface SyncedStrategy extends MergeableStrategy {
  config: unknown;
}
export interface StrategySyncPayload {
  entries: SyncedStrategy[];
  tombstones: StrategyTombstone[];
  activeId: string;
}
/** Matches `MAX_SAVED_STRATEGIES` in the client library. */
const MAX_STRATEGIES = 20;
/**
 * A strategy config is a handful of funds and withdrawal periods — a few KB at
 * the outside. The limit is a guard against a client sending something
 * pathological into a JSONB column, not a considered product cap.
 */
const MAX_CONFIG_BYTES = 256 * 1024;
const MAX_NAME_LENGTH = 60;
type Row = {
  id: string;
  name: string;
  config: unknown;
  saved_at: string | null;
  is_active: boolean;
  updated_at_ms: string | number;
  deleted_at_ms: string | number | null;
};
/** Trusts nothing from the client: shape, size and types are all re-checked. */
function sanitiseIncoming(payload: StrategySyncPayload | null | undefined): {
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
      continue; // circular or otherwise unserialisable
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
/**
 * Merges the browser's strategies with the stored ones and returns the result.
 *
 * Safe to call with an empty payload, which makes it a plain read — that is how
 * the page loads on a device that has never saved anything.
 */
export async function syncStrategiesAction(
  token?: string | null,
  payload?: StrategySyncPayload
): Promise<StrategySyncPayload> {
  const sql = getDb();
  await ensureTables(sql);
  const user = await getUserFromToken(token, sql);
  if (!user) throw new Error('Authentication required');
  const incoming = sanitiseIncoming(payload);
  // Epoch ms out of Postgres, so the timestamps compare directly against the
  // browser's `Date.now()` values without any timezone in the middle.
  const rows = (await sql`
    SELECT id, name, config, saved_at::text AS saved_at, is_active,
           (EXTRACT(EPOCH FROM updated_at) * 1000)::bigint AS updated_at_ms,
           (EXTRACT(EPOCH FROM deleted_at) * 1000)::bigint AS deleted_at_ms
    FROM user_strategies
    WHERE user_id = ${user.id}
  `) as Row[];
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
  // Stored rows go second so a tie resolves to the shared copy — see
  // `mergeStrategies`.
  const merged = mergeStrategies(
    incoming.entries,
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
    for (const entry of merged.entries) {
      await sql`
        INSERT INTO user_strategies (id, user_id, name, config, saved_at, is_active, updated_at, deleted_at)
        VALUES (
          ${entry.id}, ${user.id}, ${entry.name}, ${JSON.stringify(entry.config)}::jsonb,
          ${entry.savedAt || null}::date, ${entry.id === activeId},
          to_timestamp(${entry.updatedAt} / 1000.0), NULL
        )
        ON CONFLICT (user_id, id) DO UPDATE SET
          name = EXCLUDED.name,
          config = EXCLUDED.config,
          saved_at = EXCLUDED.saved_at,
          is_active = EXCLUDED.is_active,
          updated_at = EXCLUDED.updated_at,
          -- Clearing this is what revives an entry edited after its deletion.
          deleted_at = NULL
      `;
    }
    for (const stone of merged.tombstones) {
      await sql`
        INSERT INTO user_strategies (id, user_id, name, config, updated_at, deleted_at)
        VALUES (
          ${stone.id}, ${user.id}, '', '{}'::jsonb,
          to_timestamp(${stone.deletedAt} / 1000.0),
          to_timestamp(${stone.deletedAt} / 1000.0)
        )
        ON CONFLICT (user_id, id) DO UPDATE SET
          deleted_at = to_timestamp(${stone.deletedAt} / 1000.0),
          updated_at = to_timestamp(${stone.deletedAt} / 1000.0),
          -- The config is dead weight once the row is a tombstone.
          config = '{}'::jsonb
      `;
    }
    // Anything the merge dropped for exceeding the cap is no longer part of the
    // library and would otherwise come back on the next sync.
    const keep = [...merged.entries.map((e) => e.id), ...merged.tombstones.map((t) => t.id)];
    if (keep.length > 0) {
      await sql`DELETE FROM user_strategies WHERE user_id = ${user.id} AND id <> ALL(${keep})`;
    }
  } catch (dbErr) {
    console.warn('[strategies] write failed:', dbErr);
    throw new Error('Could not save strategies');
  }
  return { entries: merged.entries, tombstones: merged.tombstones, activeId };
}
