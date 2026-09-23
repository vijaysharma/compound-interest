'use client';
import { syncStrategiesAction, type StrategySyncPayload } from '@/actions/strategies';
import { parseStoredConfig } from './storage';
import { withServerState, type SavedStrategy, type StrategyLibrary } from './library';
/**
 * Pushing the local strategy library to the server and adopting what comes back.
 *
 * localStorage stays the working copy — it is synchronous, so edits keep
 * persisting instantly and the page still works offline or signed out. The
 * server is consulted once on load and then on a debounce, and its reconciled
 * view replaces the local one. That ordering matters: the merge lives entirely
 * server-side, so the client never has to decide which side wins.
 */
/** Same key the auth context writes. Absent means signed out; sync is skipped. */
function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}
/**
 * How long to wait after the last edit before syncing.
 *
 * The editor folds the live config into the active entry on every keystroke, so
 * without a debounce typing an amount would fire a request per character. Long
 * enough to collapse a burst of edits, short enough that switching device
 * shortly after finishing is safe.
 */
const SYNC_DEBOUNCE_MS = 4000;
function toPayload(library: StrategyLibrary): StrategySyncPayload {
  return {
    entries: library.entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      config: entry.config,
      savedAt: entry.savedAt,
      updatedAt: entry.updatedAt,
    })),
    tombstones: library.tombstones,
    activeId: library.activeId,
  };
}
/**
 * Rebuilds a library from the server's response.
 *
 * Every config is put back through `parseStoredConfig` rather than trusted as
 * it arrives. This is the same sanitising step a localStorage blob goes
 * through, and it matters more here: the row was written by some other client
 * and the server stores it as opaque JSONB without validating its shape.
 * Entries that fail to parse are dropped rather than allowed to reach the
 * editor.
 */
function fromPayload(payload: StrategySyncPayload): StrategyLibrary | null {
  const entries: SavedStrategy[] = [];
  for (const raw of payload.entries) {
    const config = parseStoredConfig(raw.config);
    if (!config) continue;
    entries.push({
      id: raw.id,
      name: raw.name,
      config,
      savedAt: raw.savedAt,
      updatedAt: Number(raw.updatedAt) || 0,
    });
  }
  if (entries.length === 0) return null;
  return withServerState(entries, payload.activeId, payload.tombstones);
}
/**
 * One sync round trip. Resolves to the merged library, or null when there is
 * nothing to apply — signed out, offline, or the server had nothing usable.
 *
 * Never throws: a failed sync must leave the local library working, because
 * localStorage has already accepted the edit.
 */
export async function syncLibrary(library: StrategyLibrary): Promise<StrategyLibrary | null> {
  const token = readAuthToken();
  if (!token) return null;
  try {
    const merged = await syncStrategiesAction(token, toPayload(library));
    return fromPayload(merged);
  } catch (err) {
    console.warn('Strategy sync failed; keeping the local library:', err);
    return null;
  }
}
/**
 * Debounces syncs and collapses overlapping ones.
 *
 * `inFlight` exists because a sync takes a round trip during which more edits
 * can land. Firing a second request concurrently would have two merges racing
 * on the same rows, and the loser's result would overwrite the winner's in the
 * client. Instead a request that arrives mid-flight is deferred until the
 * current one settles.
 */
export function createSyncScheduler(apply: (library: StrategyLibrary) => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: StrategyLibrary | null = null;
  let inFlight = false;
  const run = async () => {
    if (inFlight || !pending) return;
    const library = pending;
    pending = null;
    inFlight = true;
    try {
      const merged = await syncLibrary(library);
      if (merged) apply(merged);
    } finally {
      inFlight = false;
      // An edit that arrived while this was running still needs sending.
      if (pending) schedule(pending);
    }
  };
  const schedule = (library: StrategyLibrary, immediate = false) => {
    pending = library;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void run(), immediate ? 0 : SYNC_DEBOUNCE_MS);
  };
  return {
    schedule,
    /** Drops any queued sync, for unmount. */
    cancel: () => {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
