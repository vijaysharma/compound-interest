'use client';
import React, { useEffect, useState } from 'react';
import styles from './FontScale.module.scss';
/** Board text sizes a player can cycle through. Games start on the largest. */
export const FONT_SCALES = [1, 1.15, 1.3, 1.5] as const;
const LARGEST = FONT_SCALES.length - 1;
const storageKey = (gameId: string) => `game_font_scale_${gameId}`;
/**
 * Per-game board text size, remembered per game. `style` sets `--game-font-scale` on the game root;
 * each game's stylesheet multiplies its cell text by it.
 */
export function useGameFontScale(gameId: string) {
  const [index, setIndex] = useState(LARGEST);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(gameId));
      // Nothing saved means the default (largest); Number(null) would read as the smallest.
      const saved = raw === null ? LARGEST : Number(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is client-only
      if (Number.isInteger(saved) && saved >= 0 && saved <= LARGEST) setIndex(saved);
    } catch {
      // Storage unavailable in private mode
    }
  }, [gameId]);
  const cycle = () => {
    const next = (index + 1) % FONT_SCALES.length;
    setIndex(next);
    try {
      localStorage.setItem(storageKey(gameId), String(next));
    } catch {
      // Storage unavailable in private mode
    }
  };
  const scale = FONT_SCALES[index];
  return { scale, cycle, style: { '--game-font-scale': scale } as React.CSSProperties };
}
export const FontScaleButton: React.FC<{ scale: number; onClick: () => void }> = ({ scale, onClick }) => (
  <button
    type="button"
    className={styles.btn}
    onClick={onClick}
    title="Change board text size"
    aria-label={`Board text size ${Math.round(scale * 100)}%, tap to change`}
  >
    <span className={styles.glyph} aria-hidden="true">
      A<small>A</small>
    </span>
    <span>{Math.round(scale * 100)}%</span>
  </button>
);
