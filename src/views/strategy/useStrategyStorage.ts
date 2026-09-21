'use client';
import { useEffect, useRef } from 'react';
import { loadStoredConfig, saveStoredConfig } from './storage';
import type { StrategyConfig } from './types';
/**
 * Restores the saved configuration once after mount, then persists every
 * change. The restore runs in a `requestAnimationFrame` rather than during
 * render so the server-rendered markup and the first client render still match;
 * saved values are applied a frame later.
 */
export function useStrategyStorage(
  config: StrategyConfig,
  onRestore: (config: StrategyConfig) => void
): void {
  const isLoadedRef = useRef(false);
  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  }, [onRestore]);
  useEffect(() => {
    if (isLoadedRef.current) return;
    const frame = requestAnimationFrame(() => {
      try {
        const saved = loadStoredConfig();
        if (saved) onRestoreRef.current(saved);
      } finally {
        isLoadedRef.current = true;
      }
    });
    return () => cancelAnimationFrame(frame);
    // Restore must run exactly once; the callback is read through a ref so an
    // unstable `onRestore` identity cannot re-trigger it (infinite render loop).
  }, []);
  useEffect(() => {
    // Skip until the restore has run, so defaults cannot overwrite saved state.
    if (!isLoadedRef.current) return;
    saveStoredConfig(config);
  }, [config]);
}
