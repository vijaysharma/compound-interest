'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
export interface AntiCheatHintsOptions {
  gameId: string;
  boardId: string;
  maxHints?: number;
  cooldownSeconds?: number;
  isGameOver?: boolean;
}
export interface AntiCheatHintsResult {
  hintsUsed: number;
  hintsRemaining: number;
  cooldownRemaining: number;
  canUseHint: boolean;
  consumeHint: () => boolean;
  hintButtonLabel: string;
}
const STORAGE_PREFIX = 'anticheat_hints_';
interface StoredHintState {
  boardId: string;
  hintsUsed: number;
  cooldownEnd: number;
}
function getStoredState(gameId: string, boardId: string): StoredHintState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${gameId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredHintState;
    if (parsed.boardId === boardId) {
      return parsed;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}
function saveStoredState(gameId: string, state: StoredHintState): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${gameId}`, JSON.stringify(state));
  } catch {
    // Ignore storage write errors
  }
}
export function useAntiCheatHints({
  gameId,
  boardId,
  maxHints = 5,
  cooldownSeconds = 30,
  isGameOver = false,
}: AntiCheatHintsOptions): AntiCheatHintsResult {
  const [hintsUsed, setHintsUsed] = useState<number>(() => {
    const stored = getStoredState(gameId, boardId);
    return stored ? Math.min(maxHints, stored.hintsUsed) : 0;
  });
  const [cooldownEnd, setCooldownEnd] = useState<number>(() => {
    const stored = getStoredState(gameId, boardId);
    return stored && stored.cooldownEnd > Date.now() ? stored.cooldownEnd : 0;
  });
  const [now, setNow] = useState<number>(() => Date.now());
  const [prevBoardId, setPrevBoardId] = useState<string>(boardId);
  if (prevBoardId !== boardId) {
    setPrevBoardId(boardId);
    const stored = getStoredState(gameId, boardId);
    if (stored) {
      setHintsUsed(Math.min(maxHints, stored.hintsUsed));
      setCooldownEnd(stored.cooldownEnd > Date.now() ? stored.cooldownEnd : 0);
    } else {
      setHintsUsed(0);
      setCooldownEnd(0);
      saveStoredState(gameId, { boardId, hintsUsed: 0, cooldownEnd: 0 });
    }
  }
  // Live 1-second countdown ticker when cooldown is active
  useEffect(() => {
    if (cooldownEnd <= now) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= cooldownEnd) {
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [cooldownEnd, now]);
  const cooldownRemaining = Math.max(0, Math.ceil((cooldownEnd - now) / 1000));
  const hintsRemaining = Math.max(0, maxHints - hintsUsed);
  const canUseHint = hintsRemaining > 0 && cooldownRemaining === 0 && !isGameOver;
  const consumeHint = useCallback((): boolean => {
    const currentNow = Date.now();
    if (isGameOver || hintsUsed >= maxHints || currentNow < cooldownEnd) {
      return false;
    }
    const nextHintsUsed = hintsUsed + 1;
    const nextCooldownEnd = currentNow + cooldownSeconds * 1000;
    setHintsUsed(nextHintsUsed);
    setCooldownEnd(nextCooldownEnd);
    setNow(currentNow);
    saveStoredState(gameId, {
      boardId,
      hintsUsed: nextHintsUsed,
      cooldownEnd: nextCooldownEnd,
    });
    return true;
  }, [boardId, cooldownEnd, cooldownSeconds, gameId, hintsUsed, isGameOver, maxHints]);
  // Format button text with live timer
  let hintButtonLabel = `Hint (${hintsRemaining}/${maxHints})`;
  if (hintsRemaining <= 0) {
    hintButtonLabel = 'No Hints Left';
  } else if (cooldownRemaining > 0) {
    const mm = Math.floor(cooldownRemaining / 60)
      .toString()
      .padStart(2, '0');
    const ss = (cooldownRemaining % 60).toString().padStart(2, '0');
    hintButtonLabel = `Hint (${mm}:${ss})`;
  }
  return {
    hintsUsed,
    hintsRemaining,
    cooldownRemaining,
    canUseHint,
    consumeHint,
    hintButtonLabel,
  };
}
