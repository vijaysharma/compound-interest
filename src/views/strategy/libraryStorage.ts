import { getTodayISO } from '../../utilities/dateGuards';
import { STRATEGY_STORAGE_KEY, parseStoredConfig } from './storage';
import { createDefaultConfig } from './defaults';
import { asArray, asRecord } from './storageParsers';
import type { StrategyTombstone } from '../../utilities/strategyMerge';
import type { StrategyConfig } from './types';
export const STRATEGY_LIBRARY_KEY = 'mutual_fund_strategy_library';
export const MAX_SAVED_STRATEGIES = 20;
export const MAX_NAME_LENGTH = 60;
export interface SavedStrategy {
  id: string;
  name: string;
  config: StrategyConfig;
  savedAt: string;
  updatedAt: number;
}
export interface StrategyLibrary {
  activeId: string;
  entries: SavedStrategy[];
  tombstones: StrategyTombstone[];
}
export interface StrategySummary {
  id: string;
  name: string;
  savedAt: string;
}
let idCounter = 0;
export const nextStrategyId = (): string => {
  idCounter += 1;
  return `st-${Date.now().toString(36)}-${idCounter}`;
};
export const sanitiseName = (name: string, fallback: string): string => {
  const trimmed = name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
};
export const nextDefaultName = (entries: SavedStrategy[]): string => {
  const taken = new Set(entries.map((entry) => entry.name));
  for (let index = 1; index <= entries.length + 1; index += 1) {
    const candidate = `Strategy ${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `Strategy ${entries.length + 1}`;
};
export const copyName = (name: string, entries: SavedStrategy[]): string => {
  const taken = new Set(entries.map((entry) => entry.name));
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
    .map((v) => asRecord(v))
    .filter((v): v is Record<string, unknown> => v !== null)
    .filter((v) => typeof v.id === 'string' && Boolean(v.id))
    .map((v) => ({ id: String(v.id), deletedAt: Number.isFinite(Number(v.deletedAt)) ? Number(v.deletedAt) : 0 }));
  return {
    activeId: entries.some((entry) => entry.id === activeId) ? activeId : entries[0].id,
    entries,
    tombstones,
  };
};
export const reserveCounter = (library: StrategyLibrary): void => {
  for (const entry of library.entries) {
    const trailing = Number(entry.id.split('-').pop());
    if (Number.isFinite(trailing) && trailing > idCounter) idCounter = trailing;
  }
};
export const libraryWith = (
  entries: SavedStrategy[],
  activeId: string,
  tombstones: StrategyTombstone[] = []
): StrategyLibrary => ({ activeId, entries, tombstones });
export const singleEntryLibrary = (name: string, config: StrategyConfig): StrategyLibrary => {
  const entry = createEntry(name, config);
  return libraryWith([entry], entry.id);
};
export const hasStoredLibrary = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return Boolean(
      window.localStorage.getItem(STRATEGY_LIBRARY_KEY) ||
      window.localStorage.getItem(STRATEGY_STORAGE_KEY)
    );
  } catch {
    return false;
  }
};
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
