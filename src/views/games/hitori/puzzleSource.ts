import { generateHitori, puzzleSignature, type HitoriPuzzle } from './generator';
import { HITORI_PRESETS } from './presets';
import type { CellState, HitoriDifficulty } from './types';
const RECENT_KEY = 'rupee_calc_hitori_recent';
const RECENT_LIMIT = 40;
let memoryRecent: string[] = [];
function readRecent(): string[] {
  try {
    if (typeof sessionStorage === 'undefined') return memoryRecent;
    const raw = sessionStorage.getItem(RECENT_KEY);
    if (!raw) return memoryRecent;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : memoryRecent;
  } catch {
    return memoryRecent;
  }
}
function rememberSignature(signature: string): void {
  const next = [signature, ...readRecent().filter((s) => s !== signature)].slice(0, RECENT_LIMIT);
  memoryRecent = next;
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors (private mode, quota) - in-memory list still applies.
  }
}
/** Static fallback puzzle; deterministic, so it is also safe for the server render. */
export function presetPuzzle(difficulty: HitoriDifficulty, index = 0): HitoriPuzzle {
  const list = HITORI_PRESETS[difficulty];
  const preset = list[((index % list.length) + list.length) % list.length];
  return {
    ...preset,
    difficulty,
    label: `${preset.size}×${preset.size} ${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`,
    signature: puzzleSignature(preset.grid),
    source: 'preset',
  };
}
/**
 * Returns a freshly generated puzzle that was not served recently in this session.
 * Falls back to a (non-recent, if possible) preset if generation fails.
 */
export function createHitoriPuzzle(difficulty: HitoriDifficulty, random: () => number = Math.random): HitoriPuzzle {
  const recent = readRecent();
  const generated = generateHitori(difficulty, { random, avoidSignatures: recent });
  let puzzle = generated;
  if (!puzzle) {
    const list = HITORI_PRESETS[difficulty];
    const options = list.map((_, i) => presetPuzzle(difficulty, i));
    const fresh = options.filter((p) => !recent.includes(p.signature));
    const pool = fresh.length > 0 ? fresh : options;
    puzzle = pool[Math.floor(random() * pool.length)];
  }
  rememberSignature(puzzle.signature);
  return puzzle;
}
function isCellState(value: unknown): value is CellState {
  return value === 'unmarked' || value === 'shaded' || value === 'circled';
}
/** Validates a puzzle restored from storage; returns null if malformed. */
export function parseStoredPuzzle(value: unknown, difficulty: HitoriDifficulty): HitoriPuzzle | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Partial<HitoriPuzzle>;
  const grid = p.grid;
  const solution = p.solution;
  if (!Array.isArray(grid) || grid.length < 2 || grid.length > 12 || !Array.isArray(solution)) return null;
  const n = grid.length;
  const gridOk = grid.every((row) => Array.isArray(row) && row.length === n && row.every((v) => Number.isInteger(v)));
  const solOk =
    solution.length === n && solution.every((row) => Array.isArray(row) && row.length === n && row.every(isCellState));
  if (!gridOk || !solOk) return null;
  return {
    difficulty,
    size: n,
    label: typeof p.label === 'string' ? p.label : `${n}×${n}`,
    grid,
    solution,
    signature: puzzleSignature(grid),
    source: p.source === 'preset' ? 'preset' : 'generated',
  };
}
