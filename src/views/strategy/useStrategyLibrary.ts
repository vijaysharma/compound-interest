'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createDefaultConfig } from './defaults';
import {
  MAX_SAVED_STRATEGIES,
  activeConfig,
  loadLibrary,
  saveLibrary,
  summarise,
  withActive,
  withActiveConfig,
  withDuplicatedActive,
  withNewStrategy,
  withRenamed,
  withoutStrategy,
  type StrategyLibrary,
} from './library';
import { createSyncScheduler } from './strategySync';
import type { StrategyConfig } from './types';
import {
  type StrategyLibraryApi,
  type PickerState,
  EMPTY_PICKER,
} from './strategyLibraryTypes';
export type { StrategyLibraryApi };
/**
 * The saved strategy library, wired to the live editor config.
 * The active entry is persisted on every edit. The library lives in a ref;
 * only the picker summary and selection state trigger re-renders.
 */
export function useStrategyLibrary(
  config: StrategyConfig,
  onRestore: (config: StrategyConfig) => void
): StrategyLibraryApi {
  const libraryRef = useRef<StrategyLibrary | null>(null);
  const [picker, setPicker] = useState<PickerState>(EMPTY_PICKER);
  const [isReady, setIsReady] = useState(false);
  const onRestoreRef = useRef(onRestore);
  /**
   * Adopts the server's reconciled library.
   *
   * The active config is only handed back to the editor when the selection
   * actually moved — replacing it on every sync would overwrite whatever the
   * user is typing with the copy the request was built from.
   */
  const applyServerState = useCallback((merged: StrategyLibrary) => {
    const current = libraryRef.current;
    libraryRef.current = merged;
    saveLibrary(merged);
    setPicker({ strategies: summarise(merged), activeId: merged.activeId });
    if (current && merged.activeId !== current.activeId) {
      onRestoreRef.current(activeConfig(merged));
    }
  }, []);
  // Built inside the mount effect rather than during render: it closes over
  // refs and owns a timer, neither of which belongs in a render pass.
  const syncRef = useRef<ReturnType<typeof createSyncScheduler> | null>(null);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);
  useEffect(() => {
    if (libraryRef.current) return;
    syncRef.current = createSyncScheduler(applyServerState);
    // A frame after mount, so the server-rendered markup and the first client
    // render still match; saved values are applied immediately after.
    const frame = requestAnimationFrame(() => {
      const loaded = loadLibrary();
      libraryRef.current = loaded;
      setPicker({ strategies: summarise(loaded), activeId: loaded.activeId });
      onRestoreRef.current(activeConfig(loaded));
      setIsReady(true);
      // Immediately, not debounced: this is the pull that brings in strategies
      // saved on another device, and waiting seconds to do it would show the
      // user a stale picker first.
      syncRef.current?.schedule(loaded, true);
    });
    return () => {
      cancelAnimationFrame(frame);
      syncRef.current?.cancel();
    };
  }, [applyServerState]);
  // Fold the live config into the active entry and persist. Gated on isReady so
  // the starting defaults cannot overwrite a saved strategy before it loads.
  useEffect(() => {
    const current = libraryRef.current;
    if (!isReady || !current) return;
    const next = withActiveConfig(current, config);
    libraryRef.current = next;
    saveLibrary(next);
    // Debounced: this effect runs on every keystroke in the editor.
    syncRef.current?.schedule(next);
  }, [config, isReady]);
  /**
   * Applies a structural change, persists it, and hands the newly active
   * config back to the editor when the selection moved.
   */
  const commit = useCallback((transition: (current: StrategyLibrary) => StrategyLibrary) => {
    const current = libraryRef.current;
    if (!current) return;
    const next = transition(current);
    if (next === current) return;
    libraryRef.current = next;
    saveLibrary(next);
    setPicker({ strategies: summarise(next), activeId: next.activeId });
    if (next.activeId !== current.activeId) onRestoreRef.current(activeConfig(next));
    // Structural changes — add, rename, delete — are worth pushing promptly,
    // and unlike a config edit they cannot arrive in a burst.
    syncRef.current?.schedule(next, true);
  }, []);
  const selectStrategy = useCallback(
    (id: string) => commit((current) => withActive(current, id)),
    [commit]
  );
  const addStrategy = useCallback(
    () => commit((current) => withNewStrategy(current, createDefaultConfig())),
    [commit]
  );
  const duplicateStrategy = useCallback(
    () => commit((current) => withDuplicatedActive(current)),
    [commit]
  );
  const renameStrategy = useCallback(
    (name: string) => commit((current) => withRenamed(current, current.activeId, name)),
    [commit]
  );
  const deleteStrategy = useCallback(
    (id: string) => commit((current) => withoutStrategy(current, id)),
    [commit]
  );
  return {
    strategies: picker.strategies,
    activeId: picker.activeId,
    activeName: picker.strategies.find((entry) => entry.id === picker.activeId)?.name ?? '',
    isReady,
    canAdd: picker.strategies.length < MAX_SAVED_STRATEGIES,
    canDelete: picker.strategies.length > 1,
    selectStrategy,
    addStrategy,
    duplicateStrategy,
    renameStrategy,
    deleteStrategy,
  };
}
