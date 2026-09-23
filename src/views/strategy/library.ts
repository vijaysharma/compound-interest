import { getTodayISO } from '../../utilities/dateGuards';
import { STRATEGY_STORAGE_KEY, parseStoredConfig } from './storage';
import { createDefaultConfig } from './defaults';
import { asArray, asRecord } from './storageParsers';
import type { StrategyTombstone } from '../../utilities/strategyMerge';
import type { StrategyConfig } from './types';
export const STRATEGY_LIBRARY_KEY = 'mutual_fund_strategy_library';
/** Keeps one browser's localStorage entry to a sane size. */
export const MAX_SAVED_STRATEGIES = 20;
const MAX_NAME_LENGTH = 60;
export interface SavedStrategy {
  id: string;
  name: string;
  config: StrategyConfig;
  /** ISO date the entry was last written, shown in the picker. */
  savedAt: string;
  /**
   * Epoch ms of the last edit, used to reconcile this browser's copy with the
   * server's. `savedAt` cannot do the job: it is a calendar date, so it cannot
   * order two edits made on the same day, which is most real conflicts.
   * Entries stored before this field existed parse as 0 and lose to anything
   * with a known edit time.
   */
  updatedAt: number;
}
export interface StrategyLibrary {
  activeId: string;
  entries: SavedStrategy[];
  /**
   * Strategies deleted here but possibly still present on another device.
   *
   * A delete cannot survive a merge without one of these: the other device
   * still holds its copy, and the union of the two sides revives it. Cleared
   * by the server once every device has converged.
   */
  tombstones: StrategyTombstone[];
}
/** Entry metadata only — what the picker needs, without hauling configs around. */
export interface StrategySummary {
  id: string;
  name: string;
  savedAt: string;
}
let idCounter = 0;
const nextStrategyId = (): string => {
  idCounter += 1;
  return `st-${Date.now().toString(36)}-${idCounter}`;
};
export const sanitiseName = (name: string, fallback: string): string => {
  const trimmed = name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
};
/**
 * "Strategy 1", "Strategy 2", ... skipping numbers already taken, so adding a
 * strategy after deleting one does not produce two entries with the same name.
 */
export const nextDefaultName = (entries: SavedStrategy[]): string => {
  const taken = new Set(entries.map((entry) => entry.name));
  for (let index = 1; index <= entries.length + 1; index += 1) {
    const candidate = `Strategy ${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `Strategy ${entries.length + 1}`;
};
/** "Plan" -> "Plan copy" -> "Plan copy 2", never colliding with an existing name. */
export const copyName = (name: string, entries: SavedStrategy[]): string => {
  const taken = new Set(entries.map((entry) => entry.name));
  // Duplicating a duplicate numbers the copy rather than stacking another word
  // on the end, so a third generation reads "Plan copy 2", not "Plan copy copy".
  const root = name.replace(/\s+copy(\s+\d+)?$/i, '');
  const base = sanitiseName(`${root} copy`, 'Strategy copy');
  if (!taken.has(base)) return base;
  for (let index = 2; index <= entries.length + 2; index += 1) {
    const candidate = sanitiseName(`${base} ${index}`, base);
    if (!taken.has(candidate)) return candidate;
  }
  return base;
};
export const createEntry = (name: string, config: StrategyConfig): SavedStrategy => ({
  id: nextStrategyId(),
  name,
  config,
  savedAt: getTodayISO(),
  updatedAt: Date.now(),
});
const parseEntry = (value: unknown, index: number): SavedStrategy | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const config = parseStoredConfig(raw.config);
  if (!config) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : nextStrategyId(),
    name: sanitiseName(typeof raw.name === 'string' ? raw.name : '', `Strategy ${index + 1}`),
    config,
    savedAt: typeof raw.savedAt === 'string' ? raw.savedAt : getTodayISO(),
    updatedAt: Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : 0,
  };
};
/**
 * Rebuilds the library from a stored blob, dropping entries that no longer
 * parse. Returns null when nothing usable is left, so the caller can fall back
 * to a migration or to the defaults.
 */
export const parseStoredLibrary = (value: unknown): StrategyLibrary | null => {
  const raw = asRecord(value);
  if (!raw) return null;
  const entries = asArray(raw.entries)
    .map(parseEntry)
    .filter((entry): entry is SavedStrategy => entry !== null)
    .slice(0, MAX_SAVED_STRATEGIES);
  if (entries.length === 0) return null;
  const activeId = typeof raw.activeId === 'string' ? raw.activeId : '';
  const tombstones = asArray(raw.tombstones)
    .map((value) => asRecord(value))
    .filter((value): value is Record<string, unknown> => value !== null)
    .filter((value) => typeof value.id === 'string' && value.id)
    .map((value) => ({
      id: String(value.id),
      deletedAt: Number.isFinite(Number(value.deletedAt)) ? Number(value.deletedAt) : 0,
    }));
  return {
    activeId: entries.some((entry) => entry.id === activeId) ? activeId : entries[0].id,
    entries,
    tombstones,
  };
};
/** Ids restored from storage must not be reissued to a strategy added later. */
const reserveCounter = (library: StrategyLibrary): void => {
  for (const entry of library.entries) {
    const trailing = Number(entry.id.split('-').pop());
    if (Number.isFinite(trailing) && trailing > idCounter) idCounter = trailing;
  }
};
const libraryWith = (
  entries: SavedStrategy[],
  activeId: string,
  tombstones: StrategyTombstone[] = []
): StrategyLibrary => ({
  activeId,
  entries,
  tombstones,
});
export const singleEntryLibrary = (name: string, config: StrategyConfig): StrategyLibrary => {
  const entry = createEntry(name, config);
  return libraryWith([entry], entry.id);
};
/**
 * Loads the library, migrating a config saved by the single-strategy version of
 * this page into the first entry. The legacy key is only removed once the
 * library has been written successfully, so a failed write cannot lose it.
 */
export const loadLibrary = (): StrategyLibrary => {
  if (typeof window === 'undefined') return singleEntryLibrary('Strategy 1', createDefaultConfig());
  try {
    const stored = window.localStorage.getItem(STRATEGY_LIBRARY_KEY);
    const parsed = stored ? parseStoredLibrary(JSON.parse(stored)) : null;
    if (parsed) {
      reserveCounter(parsed);
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to restore the strategy library:', err);
  }
  try {
    const legacy = window.localStorage.getItem(STRATEGY_STORAGE_KEY);
    const config = legacy ? parseStoredConfig(JSON.parse(legacy)) : null;
    if (config) {
      const migrated = singleEntryLibrary('Strategy 1', config);
      if (saveLibrary(migrated)) window.localStorage.removeItem(STRATEGY_STORAGE_KEY);
      return migrated;
    }
  } catch (err) {
    console.warn('Failed to migrate the saved strategy:', err);
  }
  return singleEntryLibrary('Strategy 1', createDefaultConfig());
};
/** Returns false when the write failed, so callers can keep a fallback intact. */
export const saveLibrary = (library: StrategyLibrary): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STRATEGY_LIBRARY_KEY, JSON.stringify(library));
    return true;
  } catch (err) {
    console.warn('Failed to persist the strategy library:', err);
    return false;
  }
};
export const summarise = (library: StrategyLibrary): StrategySummary[] =>
  library.entries.map(({ id, name, savedAt }) => ({ id, name, savedAt }));
/** Replaces the local library with the server's reconciled view. */
export const withServerState = (
  entries: SavedStrategy[],
  activeId: string,
  tombstones: StrategyTombstone[]
): StrategyLibrary =>
  libraryWith(
    entries.slice(0, MAX_SAVED_STRATEGIES),
    entries.some((entry) => entry.id === activeId) ? activeId : (entries[0]?.id ?? ''),
    tombstones
  );
export const activeConfig = (library: StrategyLibrary): StrategyConfig =>
  library.entries.find((entry) => entry.id === library.activeId)?.config ??
  library.entries[0]?.config ??
  createDefaultConfig();
// --- Pure transitions. Each returns a new library; none of them touch storage. ---
export const withActiveConfig = (
  library: StrategyLibrary,
  config: StrategyConfig
): StrategyLibrary =>
  libraryWith(
    library.entries.map((entry) =>
      entry.id === library.activeId
        ? { ...entry, config, savedAt: getTodayISO(), updatedAt: Date.now() }
        : entry
    ),
    library.activeId,
    library.tombstones
  );
export const withActive = (library: StrategyLibrary, id: string): StrategyLibrary =>
  library.entries.some((entry) => entry.id === id)
    ? libraryWith(library.entries, id, library.tombstones)
    : library;
export const withNewStrategy = (
  library: StrategyLibrary,
  config: StrategyConfig,
  name?: string
): StrategyLibrary => {
  if (library.entries.length >= MAX_SAVED_STRATEGIES) return library;
  const entry = createEntry(sanitiseName(name ?? '', nextDefaultName(library.entries)), config);
  return libraryWith([...library.entries, entry], entry.id, library.tombstones);
};
export const withDuplicatedActive = (library: StrategyLibrary): StrategyLibrary => {
  if (library.entries.length >= MAX_SAVED_STRATEGIES) return library;
  const source = library.entries.find((entry) => entry.id === library.activeId);
  if (!source) return library;
  const entry = createEntry(copyName(source.name, library.entries), source.config);
  return libraryWith([...library.entries, entry], entry.id, library.tombstones);
};
export const withRenamed = (
  library: StrategyLibrary,
  id: string,
  name: string
): StrategyLibrary => {
  const current = library.entries.find((entry) => entry.id === id);
  if (!current) return library;
  return libraryWith(
    library.entries.map((entry) =>
      entry.id === id
        ? { ...entry, name: sanitiseName(name, current.name), updatedAt: Date.now() }
        : entry
    ),
    library.activeId,
    library.tombstones
  );
};
/**
 * Deleting the last remaining strategy would leave nothing to edit, so it is
 * refused; the caller keeps the Reset button for that case. Deleting the active
 * entry moves the selection to its neighbour.
 */
export const withoutStrategy = (library: StrategyLibrary, id: string): StrategyLibrary => {
  if (library.entries.length <= 1) return library;
  const index = library.entries.findIndex((entry) => entry.id === id);
  if (index < 0) return library;
  const entries = library.entries.filter((entry) => entry.id !== id);
  // Recorded rather than just removed, so the deletion reaches other devices
  // instead of being undone by their surviving copy on the next sync.
  const tombstones = [...library.tombstones, { id, deletedAt: Date.now() }];
  if (id !== library.activeId) return libraryWith(entries, library.activeId, tombstones);
  const neighbour = entries[Math.min(index, entries.length - 1)];
  return libraryWith(entries, neighbour.id, tombstones);
};
