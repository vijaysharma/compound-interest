'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiClock,
  FiHelpCircle,
  FiRefreshCw,
  FiRotateCcw,
  FiCheckCircle,
  FiSliders,
  FiAlertTriangle,
  FiSquare,
  FiCircle,
} from 'react-icons/fi';
import { getHint, validateHitori } from './engine';
import type { HitoriPuzzle } from './generator';
import { createHitoriPuzzle, parseStoredPuzzle, presetPuzzle } from './puzzleSource';
import type { CellState, HitoriDifficulty, HitoriMove } from './types';
import { GameShell } from '../common/GameShell';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { HowToPlayButton, HowToPlayModal } from '../common/HowToPlayModal';
import { formatGameTime, recordGameScore, useGameSession } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
import styles from './HitoriGame.module.scss';
const STORAGE_KEY = 'rupee_calc_hitori_state';
type TapMode = 'cycle' | 'shade' | 'circle';
const DIFFICULTIES: readonly HitoriDifficulty[] = ['easy', 'medium', 'hard'];
interface SavedHitoriState {
  difficulty: HitoriDifficulty;
  /** Generated (or fallback preset) puzzle being played. */
  puzzle?: HitoriPuzzle;
  /** Legacy saves (before procedural generation) referenced a preset by index. */
  puzzleIndex?: number;
  cellStates: CellState[];
  elapsedSeconds: number;
  hintsUsed: number;
  isComplete: boolean;
}
export const HitoriGame: React.FC = () => {
  useGameSession('hitori');
  // Deterministic preset for the server render; replaced by a generated puzzle on mount.
  const [activePreset, setActivePreset] = useState<HitoriPuzzle>(() => presetPuzzle('easy'));
  const difficulty = activePreset.difficulty;
  const size = activePreset.size;
  const [cellStates, setCellStates] = useState<CellState[]>(() =>
    Array(activePreset.size * activePreset.size).fill('unmarked')
  );
  const [history, setHistory] = useState<HitoriMove[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [tapMode, setTapMode] = useState<TapMode>('cycle');
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const elapsedSecondsRef = useRef<number>(elapsedSeconds);
  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);
  const [activeHint, setActiveHint] = useState<{
    row: number;
    col: number;
    suggestedState: CellState;
    explanation: string;
  } | null>(null);
  // Validation output
  const validation = useMemo(() => {
    return validateHitori(activePreset.grid, cellStates);
  }, [activePreset.grid, cellStates]);
  // Conflict coordinate set for highlighting red
  const conflictCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const v of validation.violations) {
      for (const [r, c] of v.cells) {
        set.add(`${r}-${c}`);
      }
    }
    return set;
  }, [validation.violations]);
  // Auto-win check when board state changes
  useEffect(() => {
    if (!isComplete && validation.isComplete && isStarted) {
      const res = recordGameScore({
        gameId: 'hitori',
        gameName: 'Hitori',
        difficulty,
        timeSeconds: Math.max(1, elapsedSeconds),
        outcome: 'won',
        hintsUsed,
      });
      const frame = requestAnimationFrame(() => {
        setIsComplete(true);
        setPersonalBest(res.isPersonalBest);
        setScoreBreakdown(res.scoreBreakdown);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [validation.isComplete, isComplete, isStarted, difficulty, elapsedSeconds, hintsUsed]);
  // Timer effect
  useEffect(() => {
    if (!isStarted || isComplete) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted, isComplete]);
  // Restore saved state
  const applySaved = useCallback((saved: SavedHitoriState) => {
    const savedDiff: HitoriDifficulty = DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : 'easy';
    const restoredPuzzle =
      parseStoredPuzzle(saved.puzzle, savedDiff) ??
      (saved.puzzle ? null : presetPuzzle(savedDiff, saved.puzzleIndex || 0));
    if (!restoredPuzzle || saved.cellStates.length !== restoredPuzzle.size * restoredPuzzle.size) {
      const fresh = createHitoriPuzzle(savedDiff);
      setActivePreset(fresh);
      setCellStates(Array(fresh.size * fresh.size).fill('unmarked'));
      setElapsedSeconds(0);
      setHintsUsed(0);
      setIsComplete(false);
      setIsStarted(false);
      return;
    }
    setActivePreset(restoredPuzzle);
    setCellStates(saved.cellStates);
    setElapsedSeconds(saved.elapsedSeconds || 0);
    setHintsUsed(saved.hintsUsed || 0);
    setIsComplete(saved.isComplete || false);
    setIsStarted((saved.elapsedSeconds || 0) > 0);
  }, []);
  useEffect(() => {
    let active = true;
    let restored = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedHitoriState = JSON.parse(raw);
        restored = Boolean(saved && saved.difficulty && Array.isArray(saved.cellStates));
        if (restored) {
          requestAnimationFrame(() => {
            if (!active) return;
            applySaved(saved);
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
    if (!restored) {
      requestAnimationFrame(() => {
        if (!active) return;
        setActivePreset(createHitoriPuzzle('easy'));
      });
    }
    const token = getAuthToken();
    const guestId = getOrCreateGuestId();
    void getUserAppStateAction<SavedHitoriState>(token, guestId, 'games', 'hitori').then((res) => {
      if (active && res.success && res.payload) {
        const saved = res.payload;
        if (saved.difficulty && Array.isArray(saved.cellStates)) {
          applySaved(saved);
        }
      }
    });
    return () => {
      active = false;
    };
  }, [applySaved]);
  // Save state (persists only on board changes, hints, or completion - avoiding timer POST loop)
  useEffect(() => {
    const stateToSave: SavedHitoriState = {
      difficulty,
      puzzle: activePreset,
      cellStates,
      elapsedSeconds: elapsedSecondsRef.current,
      hintsUsed,
      isComplete,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage errors
    }
    const timeout = setTimeout(() => {
      const token = getAuthToken();
      const guestId = getOrCreateGuestId();
      void saveUserAppStateAction(token, guestId, 'games', 'hitori', stateToSave);
    }, 600);
    return () => clearTimeout(timeout);
  }, [difficulty, activePreset, cellStates, hintsUsed, isComplete]);
  // Start (or restart) a puzzle with a clean board
  const resetGame = useCallback(
    (nextPuzzle?: HitoriPuzzle) => {
      const target = nextPuzzle ?? activePreset;
      setActivePreset(target);
      setCellStates(Array(target.size * target.size).fill('unmarked'));
      setHistory([]);
      setElapsedSeconds(0);
      setIsStarted(false);
      setIsComplete(false);
      setHintsUsed(0);
      setPersonalBest(false);
      setScoreBreakdown(null);
      setActiveHint(null);
    },
    [activePreset]
  );
  const handleDifficultyChange = (newDiff: HitoriDifficulty) => {
    if (newDiff === difficulty) return;
    resetGame(createHitoriPuzzle(newDiff));
  };
  const handleNextPuzzle = () => {
    resetGame(createHitoriPuzzle(difficulty));
  };
  // Cell Click / Interaction
  const handleCellClick = (r: number, c: number) => {
    if (isComplete) return;
    if (!isStarted) setIsStarted(true);
    setActiveHint(null);
    const idx = r * size + c;
    const current = cellStates[idx];
    let next: CellState;
    if (tapMode === 'shade') {
      next = current === 'shaded' ? 'unmarked' : 'shaded';
    } else if (tapMode === 'circle') {
      next = current === 'circled' ? 'unmarked' : 'circled';
    } else {
      // Cycle: unmarked -> shaded -> circled -> unmarked
      if (current === 'unmarked') next = 'shaded';
      else if (current === 'shaded') next = 'circled';
      else next = 'unmarked';
    }
    setHistory((prev) => [...prev, { row: r, col: c, from: current, to: next }]);
    setCellStates((prev) => {
      const updated = [...prev];
      updated[idx] = next;
      return updated;
    });
  };
  // Right-click or long-press to circle in cycle mode
  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (isComplete) return;
    if (!isStarted) setIsStarted(true);
    setActiveHint(null);
    const idx = r * size + c;
    const current = cellStates[idx];
    const next: CellState = current === 'circled' ? 'unmarked' : 'circled';
    setHistory((prev) => [...prev, { row: r, col: c, from: current, to: next }]);
    setCellStates((prev) => {
      const updated = [...prev];
      updated[idx] = next;
      return updated;
    });
  };
  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isComplete) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCellStates((prev) => {
      const updated = [...prev];
      updated[last.row * size + last.col] = last.from;
      return updated;
    });
  };
  // Hint button
  const handleHint = () => {
    if (isComplete) return;
    if (!isStarted) setIsStarted(true);
    const hint = getHint(activePreset.grid, cellStates, activePreset.solution);
    if (!hint) {
      setActiveHint({
        row: -1,
        col: -1,
        suggestedState: 'unmarked',
        explanation: 'All current marks look consistent! Keep checking rows and columns.',
      });
      return;
    }
    setHintsUsed((prev) => prev + 1);
    setActiveHint(hint);
    // Apply the hint directly
    const idx = hint.row * size + hint.col;
    const prevVal = cellStates[idx];
    setHistory((prev) => [...prev, { row: hint.row, col: hint.col, from: prevVal, to: hint.suggestedState }]);
    setCellStates((prev) => {
      const copy = [...prev];
      copy[idx] = hint.suggestedState;
      return copy;
    });
  };
  // Auto-Circle Neighbors helper (Quality of Life: circling all neighbors of currently shaded cells)
  const handleAutoCircleNeighbors = () => {
    if (isComplete) return;
    let changed = false;
    const updated = [...cellStates];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (cellStates[r * size + c] === 'shaded') {
          for (const [nr, nc] of [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ]) {
            if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
              const nIdx = nr * size + nc;
              if (updated[nIdx] === 'unmarked') {
                updated[nIdx] = 'circled';
                changed = true;
              }
            }
          }
        }
      }
    }
    if (changed) {
      if (!isStarted) setIsStarted(true);
      setCellStates(updated);
    }
  };
  return (
    <GameShell className={styles.container}>
      <GameShell.Header
        title="Hitori"
        subtitle="Eliminate duplicate numbers by shading cells"
        actions={
          <div className={styles.headerActions}>
            <HowToPlayButton onClick={() => setShowHowToPlay(true)} />
            <QuitButton onClick={() => setShowQuitModal(true)} />
          </div>
        }
      />
      {/* HUD stats */}
      <div className={styles.hudBar}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Difficulty</span>
          <span className={`${styles.hudValue} ${styles.hudValueCapitalize}`}>
            {difficulty}
          </span>
        </div>
        <div className={styles.timerBadge}>
          <FiClock size={16} />
          <span>{formatGameTime(elapsedSeconds)}</span>
        </div>
        <div className={`${styles.hudStat} ${styles.hudStatRight}`}>
          <span className={styles.hudLabel}>Hints</span>
          <span className={styles.hudValue}>{hintsUsed}</span>
        </div>
      </div>
      {/* Top controls */}
      <div className={styles.topControls}>
        <div className={styles.difficultySelector} role="tablist" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.diffBtn} ${difficulty === d ? styles.diffBtnActive : ''}`}
              onClick={() => handleDifficultyChange(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.puzzleSwitcher}>
          <button
            type="button"
            className={styles.puzzleBtn}
            onClick={handleNextPuzzle}
            title="Generate a new puzzle at this difficulty"
          >
            <FiRefreshCw size={13} />
            <span>New {size}×{size} Puzzle</span>
          </button>
        </div>
      </div>
      {/* Tap Mode Segmented Bar for Mobile */}
      <div className={styles.tapModeBar}>
        <span className={styles.tapModeLabel}>Tap Action:</span>
        <div className={styles.segmentedMode}>
          <button
            type="button"
            className={`${styles.modeBtn} ${tapMode === 'cycle' ? styles.modeBtnActive : ''}`}
            onClick={() => setTapMode('cycle')}
          >
            Cycle
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${tapMode === 'shade' ? styles.modeBtnActive : ''}`}
            onClick={() => setTapMode('shade')}
          >
            <span className={styles.modeIconSquare} aria-hidden="true" />
            <span>Shade</span>
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${tapMode === 'circle' ? styles.modeBtnActive : ''}`}
            onClick={() => setTapMode('circle')}
          >
            <span className={styles.modeIconCircle} aria-hidden="true" />
            <span>Circle</span>
          </button>
        </div>
      </div>
      {/* Hint Banner if active */}
      {activeHint && (
        <div className={styles.hintBanner}>
          <FiHelpCircle size={18} className={styles.hintIcon} />
          <span>{activeHint.explanation}</span>
        </div>
      )}
      {/* Violations notice */}
      {validation.violations.length > 0 && isStarted && (
        <div className={`${styles.statusMessage} ${styles.warningStatus}`}>
          <FiAlertTriangle className={styles.warningIcon} />
          <span>{validation.violations[0].message}</span>
        </div>
      )}
      {/* Board Card */}
      <div className={styles.boardCard}>
        <div className={styles.gridContainer}>
          <div
            className={`${styles.grid} ${size >= 8 ? styles.gridDense : ''}`}
            style={{ '--hitori-size': size } as React.CSSProperties}
          >
            {activePreset.grid.map((row, r) =>
              row.map((val, c) => {
                const idx = r * size + c;
                const state = cellStates[idx];
                const isConflict = conflictCellKeys.has(`${r}-${c}`);
                const isHintCell = activeHint && activeHint.row === r && activeHint.col === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`
                      ${styles.cell}
                      ${state === 'shaded' ? styles.cellShaded : ''}
                      ${state === 'circled' ? styles.cellCircled : ''}
                      ${isConflict ? styles.cellConflict : ''}
                      ${isHintCell ? styles.cellHint : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleContextMenu(e, r, c)}
                    aria-label={`Row ${r + 1}, Column ${c + 1}: ${val} (${state})`}
                  >
                    <span className={styles.cellNumber}>{val}</span>
                    {state === 'circled' && <span className={styles.circleRing} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* Action Toolbar */}
      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleUndo}
          disabled={history.length === 0 || isComplete}
          title="Undo last action"
        >
          <FiRotateCcw size={16} />
          <span>Undo</span>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleAutoCircleNeighbors}
          disabled={isComplete}
          title="Circle all neighbors around black cells"
        >
          <FiCheckCircle size={16} />
          <span>Auto-Circle</span>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.primaryAction}`}
          onClick={handleHint}
          disabled={isComplete}
          title="Get logical hint"
        >
          <FiHelpCircle size={16} />
          <span>Hint</span>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => resetGame()}
          title="Reset board"
        >
          <FiRefreshCw size={16} />
          <span>Reset</span>
        </button>
      </div>
      {/* Rules and Instructions */}
      <div className={styles.instructionsCard}>
        <h3 className={styles.instructionTitle}>
          <FiSliders size={16} /> Rules of Hitori
        </h3>
        <ol className={styles.ruleList}>
          <li>
            <strong>No Duplicates:</strong> Unshaded numbers cannot appear more than once in any row or column.
          </li>
          <li>
            <strong>No Adjacent Black Cells:</strong> Shaded (black) cells cannot touch orthogonally (up, down, left, right).
          </li>
          <li>
            <strong>Connected White Cells:</strong> All unshaded numbers must form a single continuous orthogonal path.
          </li>
        </ol>
      </div>
      {/* Modals */}
      {isComplete && (
        <GameOverModal
          outcome="won"
          gameTitle={`Hitori (${activePreset.label})`}
          subtitle="Congratulations! You solved all row & column duplicates while maintaining connectivity!"
          scoreBreakdown={scoreBreakdown || undefined}
          timeSeconds={elapsedSeconds}
          stats={[
            { label: 'Time', value: formatGameTime(elapsedSeconds) },
            { label: 'Grid Size', value: `${size}×${size}` },
            { label: 'Hints Used', value: hintsUsed },
          ]}
          isPersonalBest={personalBest}
          onPlayAgain={handleNextPuzzle}
          playAgainLabel="Next Puzzle"
          hubHref="/games"
        />
      )}
      <QuitModal
        isOpen={showQuitModal}
        gameTitle="Hitori"
        onCancel={() => setShowQuitModal(false)}
        onConfirmQuit={() => setShowQuitModal(false)}
      />
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        gameTitle="Hitori"
        objective="Eliminate duplicate numbers in every row and column by shading cells black, while ensuring no black cells touch and all unshaded numbers remain connected."
        rules={[
          <><strong>No Duplicates:</strong> No number may appear more than once in any row or column among the unshaded (white) cells.</>,
          <><strong>No Adjacent Black Cells:</strong> Black (shaded) cells cannot touch horizontally or vertically. They may only touch diagonally.</>,
          <><strong>One Connected Group:</strong> All unshaded numbers must connect together orthogonally into a single continuous network. Shading must never isolate an area.</>,
        ]}
        controls={{
          desktop: 'Click to cycle cell states (Unmarked → Shaded → Circled). Right-click directly circles a confirmed cell.',
          mobile: 'Use the Tap Action bar above the grid to select "Cycle", "Shade", or "Circle", then tap tiles on the board.',
          shortcuts: 'Use "Auto-Circle" to automatically circle all neighbors of black cells, or "Hint" for logic guidance.',
        }}
        tips={[
          'When two identical numbers are adjacent, at least one must be shaded, and any other identical number in that row/column must also be shaded.',
          'When a number is sandwiched between two identical numbers (e.g. 5 - 2 - 5), the middle number must be circled (white), because both 5s cannot be shaded without isolating cells.',
          'Whenever you shade a cell black, immediately circle its four orthogonal neighbors, because black cells cannot touch.',
        ]}
      />
    </GameShell>
  );
};
export default HitoriGame;
