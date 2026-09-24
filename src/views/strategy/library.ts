import { getTodayISO } from '../../utilities/dateGuards';
import { createDefaultConfig } from './defaults';
import type { StrategyTombstone } from '../../utilities/strategyMerge';
import type { StrategyConfig } from './types';
import {
  MAX_SAVED_STRATEGIES,
  copyName,
  createEntry,
  libraryWith,
  nextDefaultName,
  sanitiseName,
  type SavedStrategy,
  type StrategyLibrary,
  type StrategySummary,
} from './libraryStorage';
export * from './libraryStorage';
export const summarise = (library: StrategyLibrary): StrategySummary[] =>
  library.entries.map(({ id, name, savedAt }) => ({ id, name, savedAt }));
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
export const withoutStrategy = (library: StrategyLibrary, id: string): StrategyLibrary => {
  if (library.entries.length <= 1) return library;
  const index = library.entries.findIndex((entry) => entry.id === id);
  if (index < 0) return library;
  const entries = library.entries.filter((entry) => entry.id !== id);
  const tombstones = [...library.tombstones, { id, deletedAt: Date.now() }];
  if (id !== library.activeId) return libraryWith(entries, library.activeId, tombstones);
  const neighbour = entries[Math.min(index, entries.length - 1)];
  return libraryWith(entries, neighbour.id, tombstones);
};
