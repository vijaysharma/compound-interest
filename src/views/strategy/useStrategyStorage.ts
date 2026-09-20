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
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const saved = loadStoredConfig();
        if (saved) onRestore(saved);
      } finally {
        isLoadedRef.current = true;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [onRestore]);
  useEffect(() => {
    // Skip until the restore has run, so defaults cannot overwrite saved state.
    if (!isLoadedRef.current) return;
    saveStoredConfig(config);
  }, [config]);
}
