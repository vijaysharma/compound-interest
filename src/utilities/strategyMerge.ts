/**
 * Reconciling a browser's saved strategies with the ones held server-side.
 *
 * ## Per entry, not per library
 *
 * Merging is done one strategy at a time. Storing the whole library as a single
 * blob and taking the newer copy would be far less code, but it loses data in
 * the ordinary case: edit "Plan A" on a phone and "Plan B" on a laptop, and
 * whichever saves second silently discards the other's work. Resolving each
 * entry on its own timestamp means both survive, because they are different
 * rows that were never in conflict.
 *
 * ## Why entries carry `updatedAt` as well as `savedAt`
 *
 * `savedAt` is a calendar date, which is what the picker displays. It cannot
 * order two edits made on the same day — i.e. almost every real conflict — so
 * resolution uses a millisecond `updatedAt` instead. Entries written before
 * that field existed default to 0, which makes them lose to anything newer.
 * That is the right way round: a record with no known edit time should not
 * overwrite one that has one.
 *
 * ## Deletions need tombstones
 *
 * Without them a delete cannot survive a merge. Device A removes a strategy,
 * device B still has its copy, and the union of the two brings it back — the
 * deletion looks like it never happened. A tombstone is a positive record that
 * the entry was removed at a known time, so it can out-rank a stale copy the
 * same way a newer edit does.
 */
export interface MergeableStrategy {
  id: string;
  name: string;
  config: unknown;
  /** Calendar date shown in the picker. */
  savedAt: string;
  /** Epoch ms of the last edit. Resolution key. */
  updatedAt: number;
}
export interface StrategyTombstone {
  id: string;
  /** Epoch ms the entry was deleted. */
  deletedAt: number;
}
export interface MergeResult<T extends MergeableStrategy> {
  entries: T[];
  tombstones: StrategyTombstone[];
}
/**
 * Merges two sides into one, resolving each id independently.
 *
 * Neither argument is treated as authoritative — the newer record wins whether
 * it came from the browser or the database, which is what makes the same
 * function usable for a push and a pull.
 *
 * `max` caps the result, keeping the most recently edited. The cap is applied
 * after resolution so a merge cannot drop a newer entry in favour of an older
 * one that happened to be listed first.
 */
export function mergeStrategies<T extends MergeableStrategy>(
  left: readonly T[],
  leftTombstones: readonly StrategyTombstone[],
  right: readonly T[],
  rightTombstones: readonly StrategyTombstone[],
  max: number
): MergeResult<T> {
  const byId = new Map<string, T>();
  for (const entry of [...left, ...right]) {
    if (!entry?.id) continue;
    const existing = byId.get(entry.id);
    // `>=` rather than `>` so that when timestamps tie, the later argument
    // wins. Callers pass the server's own rows second, making the stored copy
    // the tie-breaker; a tie means neither side can prove it is newer, and
    // preferring the shared copy keeps devices converging rather than flapping.
    if (!existing || entry.updatedAt >= existing.updatedAt) {
      byId.set(entry.id, entry);
    }
  }
  const tombstones = new Map<string, StrategyTombstone>();
  for (const stone of [...leftTombstones, ...rightTombstones]) {
    if (!stone?.id) continue;
    const existing = tombstones.get(stone.id);
    if (!existing || stone.deletedAt > existing.deletedAt) {
      tombstones.set(stone.id, stone);
    }
  }
  for (const [id, stone] of tombstones) {
    const entry = byId.get(id);
    // An edit strictly newer than the deletion revives the entry — the user
    // deleted it, then changed their mind on another device. A deletion at or
    // after the last edit wins.
    if (entry && stone.deletedAt >= entry.updatedAt) {
      byId.delete(id);
    }
  }
  const entries = [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, max);
  // Tombstones for ids that survived are spent, and keeping them would let a
  // stale delete re-fire later. Dropping them also stops the list growing
  // without bound.
  const surviving = new Set(entries.map((entry) => entry.id));
  return {
    entries,
    tombstones: [...tombstones.values()].filter((stone) => !surviving.has(stone.id)),
  };
}
