'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiClock,
  FiHelpCircle,
  FiRotateCcw,
  FiRotateCw,
  FiRefreshCw,
  FiAward,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiLogOut,
} from 'react-icons/fi';
import {
  applyCellAction,
  createInitialGrid,
  evaluateBoardState,
  getCellBorders,
  REGION_THEMES,
} from './engine';
import { generateQueensPuzzle } from './generator';
import { generateQueensHint, isUniqueSolution } from './solver';
import type { CellState, Position, QueensHint, QueensMove, QueensPuzzle, QueensStats } from './types';
import { GameShell } from '../common/GameShell';
import { GameOverModal } from '../common/GameOverModal';
import { HowToPlayModal } from '../common/HowToPlayModal';
import { QuitModal } from '../common/QuitModal';
import { ConfettiCanvas } from '../common/ConfettiCanvas';
import { formatGameTime, recordGameScore, useGameSession } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
import styles from './QueensGame.module.scss';

const STORAGE_KEY = 'rupee_calc_queens_saved_game_v1';
const STATS_KEY = 'rupee_calc_queens_stats_v1';
const QUEENS_SIZE = 7;
// Older saves may hold boards from earlier generators; only resume solvable 7×7 ones.
const isPlayablePuzzle = (p: QueensPuzzle) =>
  p.size === QUEENS_SIZE && p.regions?.length === QUEENS_SIZE && isUniqueSolution(p.size, p.regions);

interface SavedGameState {
  puzzle: QueensPuzzle;
  grid: CellState[][];
  elapsedSeconds: number;
  hintsUsed: number;
  movesCount: number;
  isWon: boolean;
}

const loadSavedStats = (): QueensStats => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { gamesPlayed: 0, gamesWon: 0, bestTime: 0, totalTime: 0, currentStreak: 0, maxStreak: 0 };
  }
  try {
    const raw = window.localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { gamesPlayed: 0, gamesWon: 0, bestTime: 0, totalTime: 0, currentStreak: 0, maxStreak: 0 };
};

const saveStatsToStorage = (stats: QueensStats) => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
};

export const QueensGame: React.FC = () => {
  useGameSession('queens');
  // Puzzle & Grid state
  const [puzzle, setPuzzle] = useState<QueensPuzzle | null>(null);
  const [grid, setGrid] = useState<CellState[][]>([]);
  const [history, setHistory] = useState<QueensMove[]>([]);
  const [redoStack, setRedoStack] = useState<QueensMove[]>([]);

  // Game control state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [activeHint, setActiveHint] = useState<QueensHint | null>(null);
  const [focusedCell, setFocusedCell] = useState<Position>({ r: 0, c: 0 });

  // Modals & Results
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [stats, setStats] = useState<QueensStats>(loadSavedStats);
  // Until the cloud save has been read, don't overwrite it with the placeholder board.
  const cloudCheckedRef = useRef(false);

  const elapsedSecondsRef = useRef<number>(0);
  elapsedSecondsRef.current = elapsedSeconds;

  const size = puzzle?.size ?? QUEENS_SIZE;

  // Board evaluation
  const evaluation = useMemo(() => {
    if (!puzzle || grid.length !== puzzle.size) {
      return { isWon: false, placedQueens: 0, conflicts: [], rowsCompleted: 0, colsCompleted: 0, regionsCompleted: 0 };
    }
    return evaluateBoardState(puzzle.size, puzzle.regions, grid);
  }, [puzzle, grid]);

  // Timer interval
  useEffect(() => {
    if (!isStarted || isWon) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isWon]);

  // Handle Win Condition
  useEffect(() => {
    if (evaluation.isWon && !isWon && isStarted && puzzle) {
      const finalTime = Math.max(1, elapsedSecondsRef.current);
      setIsWon(true);

      // Record to global/local leaderboard
      const res = recordGameScore({
        gameId: 'queens',
        gameName: 'Queens Logic Puzzle',
        difficulty: `${puzzle.size}x${puzzle.size}`,
        timeSeconds: finalTime,
        outcome: 'won',
        hintsUsed,
        moves: movesCount,
      });

      setPersonalBest(res.isPersonalBest);
      setScoreBreakdown(res.scoreBreakdown);

      // Update Queens specific stats
      setStats((prev) => {
        const nextPlayed = prev.gamesPlayed + 1;
        const nextWon = prev.gamesWon + 1;
        const nextBest = prev.bestTime === 0 ? finalTime : Math.min(prev.bestTime, finalTime);
        const nextStreak = prev.currentStreak + 1;
        const nextMaxStreak = Math.max(prev.maxStreak, nextStreak);
        const updated: QueensStats = {
          gamesPlayed: nextPlayed,
          gamesWon: nextWon,
          bestTime: nextBest,
          totalTime: prev.totalTime + finalTime,
          currentStreak: nextStreak,
          maxStreak: nextMaxStreak,
          lastPlayedDate: new Date().toISOString(),
        };
        saveStatsToStorage(updated);
        return updated;
      });
    }
  }, [evaluation.isWon, isWon, isStarted, puzzle, hintsUsed, movesCount]);

  // Generated on the device: a 7×7 board takes milliseconds, while a server round-trip left the
  // board blank (or the button spinning) for seconds.
  const generateNewPuzzle = useCallback(() => {
    setActiveHint(null);
    setIsWon(false);
    setIsStarted(false);
    setElapsedSeconds(0);
    setHintsUsed(0);
    setMovesCount(0);
    setHistory([]);
    setRedoStack([]);
    const localPuzzle = generateQueensPuzzle({ size: QUEENS_SIZE });
    setPuzzle(localPuzzle);
    setGrid(createInitialGrid(localPuzzle.size));
  }, []);

  // Initial load: restore persisted state or generate fresh
  useEffect(() => {
    let active = true;

    const restore = (saved: SavedGameState) => {
      if (!saved || !saved.puzzle || !Array.isArray(saved.grid)) return false;
      if (saved.grid.length !== saved.puzzle.size || !isPlayablePuzzle(saved.puzzle)) return false;
      setPuzzle(saved.puzzle);
      setGrid(saved.grid);
      setElapsedSeconds(saved.elapsedSeconds || 0);
      setHintsUsed(saved.hintsUsed || 0);
      setMovesCount(saved.movesCount || 0);
      setIsWon(saved.isWon || false);
      setIsStarted((saved.elapsedSeconds || 0) > 0 && !saved.isWon);
      setHistory([]);
      setRedoStack([]);
      return true;
    };

    // Try local storage
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (restore(parsed)) {
          // Synchronized with cloud
          const token = getAuthToken();
          const guestId = getOrCreateGuestId();
          void getUserAppStateAction<SavedGameState>(token, guestId, 'games', 'queens').then((res) => {
            if (active && res.success && res.payload && res.payload.elapsedSeconds > parsed.elapsedSeconds) {
              restore(res.payload);
            }
          }).finally(() => {
            cloudCheckedRef.current = true;
          });
          return;
        }
      }
    } catch {
      // fallback
    }

    // Nothing saved locally: show a board now, then resume an unfinished cloud game if there is one.
    generateNewPuzzle();
    const token = getAuthToken();
    const guestId = getOrCreateGuestId();
    void getUserAppStateAction<SavedGameState>(token, guestId, 'games', 'queens')
      .then((res) => {
        if (active && res.success && res.payload && !res.payload.isWon && res.payload.elapsedSeconds > 0) {
          restore(res.payload);
        }
      })
      .finally(() => {
        cloudCheckedRef.current = true;
      });

    return () => {
      active = false;
    };
  }, [generateNewPuzzle]);

  // Persist state on mutations
  useEffect(() => {
    if (!puzzle || grid.length !== puzzle.size) return;

    const stateToSave: SavedGameState = {
      puzzle,
      grid,
      elapsedSeconds: elapsedSecondsRef.current,
      hintsUsed,
      movesCount,
      isWon,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }

    if (!cloudCheckedRef.current) return;
    const timeout = setTimeout(() => {
      const token = getAuthToken();
      const guestId = getOrCreateGuestId();
      void saveUserAppStateAction(token, guestId, 'games', 'queens', stateToSave);
    }, 600);

    return () => clearTimeout(timeout);
  }, [puzzle, grid, hintsUsed, movesCount, isWon]);

  // Core cell interaction
  const handleCellTap = (r: number, c: number) => {
    if (isWon || !puzzle) return;
    if (!isStarted) setIsStarted(true);

    // Tap always toggles a queen; X marks remain available from the keyboard (X / Space).
    const prevVal = grid[r][c];
    const nextVal: CellState = prevVal === 'queen' ? 'empty' : 'queen';
    const nextGrid = applyCellAction(grid, r, c, 'toggle_queen');

    setGrid(nextGrid);
    setHistory((prev) => [...prev, { r, c, prev: prevVal, next: nextVal }]);
    setRedoStack([]);
    setMovesCount((prev) => prev + 1);
    setFocusedCell({ r, c });

    // Dismiss active hint if touched
    if (activeHint && activeHint.highlightCells.some((hc) => hc.r === r && hc.c === c)) {
      setActiveHint(null);
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (history.length === 0 || isWon) return;
    const lastMove = history[history.length - 1];
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[lastMove.r][lastMove.c] = lastMove.prev;
      return next;
    });
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, lastMove]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || isWon) return;
    const move = redoStack[redoStack.length - 1];
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[move.r][move.c] = move.next;
      return next;
    });
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setHistory((prev) => [...prev, move]);
  };

  // Hint
  const handleHint = () => {
    if (isWon || !puzzle) return;
    if (!isStarted) setIsStarted(true);

    const hint = generateQueensHint(puzzle.size, puzzle.regions, grid, puzzle.solution);
    if (hint) {
      setHintsUsed((prev) => prev + 1);
      setActiveHint(hint);
    }
  };

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showHowToPlay || showQuitModal || showStatsModal || isWon || !puzzle) return;

      const { r, c } = focusedCell;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedCell({ r: Math.max(0, r - 1), c });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedCell({ r: Math.min(puzzle.size - 1, r + 1), c });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedCell({ r, c: Math.max(0, c - 1) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedCell({ r, c: Math.min(puzzle.size - 1, c + 1) });
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        if (!isStarted) setIsStarted(true);
        const prevVal = grid[r][c];
        const nextVal = prevVal === 'queen' ? 'empty' : 'queen';
        const nextGrid = applyCellAction(grid, r, c, 'toggle_queen');
        setGrid(nextGrid);
        setHistory((prev) => [...prev, { r, c, prev: prevVal, next: nextVal }]);
        setRedoStack([]);
        setMovesCount((prev) => prev + 1);
      } else if (e.key === 'x' || e.key === 'X' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isStarted) setIsStarted(true);
        const prevVal = grid[r][c];
        const nextVal = prevVal === 'x' ? 'empty' : 'x';
        const nextGrid = applyCellAction(grid, r, c, 'toggle_x');
        setGrid(nextGrid);
        setHistory((prev) => [...prev, { r, c, prev: prevVal, next: nextVal }]);
        setRedoStack([]);
        setMovesCount((prev) => prev + 1);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, grid, puzzle, isWon, isStarted, showHowToPlay, showQuitModal, showStatsModal]);

  // Conflict coordinate set for fast O(1) lookup
  const conflictCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const conflict of evaluation.conflicts) {
      for (const cell of conflict.cells) {
        set.add(`${cell.r},${cell.c}`);
      }
    }
    return set;
  }, [evaluation.conflicts]);

  const hintCellKeys = useMemo(() => {
    const set = new Set<string>();
    if (activeHint) {
      for (const cell of activeHint.highlightCells) {
        set.add(`${cell.r},${cell.c}`);
      }
    }
    return set;
  }, [activeHint]);

  return (
    <GameShell className={styles.container}>
      {isWon && <ConfettiCanvas />}

      {/* Header */}
      <GameShell.Header
        title="Queens Puzzle"
        subtitle="One queen per row, column, & region • No touching"
        icon={<FiAward className={styles.crownBadge} aria-hidden="true" />}
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowStatsModal(true)}
              title="Statistics"
              aria-label="View Statistics"
            >
              <FiAward size={18} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowHowToPlay(true)}
              title="How to Play"
              aria-label="How to Play"
            >
              <FiHelpCircle size={18} />
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setShowQuitModal(true)}
              title="Exit Game"
              aria-label="Exit Game"
            >
              <FiLogOut size={18} />
            </button>
          </div>
        }
      />

      {/* HUD Info Bar */}
      <div className={styles.hudBar}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Grid</span>
          <span className={styles.hudValue}>{size}×{size}</span>
        </div>

        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Queens</span>
          <span className={styles.hudValue}>{evaluation.placedQueens} / {size}</span>
        </div>

        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Timer</span>
          <div className={styles.timerBadge}>
            <FiClock size={14} />
            <span>{formatGameTime(elapsedSeconds)}</span>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
          onClick={generateNewPuzzle}
        >
          <FiRefreshCw size={13} />
          <span>New Puzzle</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolBar}>
        <div className={styles.controlsBar}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleUndo}
            disabled={history.length === 0 || isWon}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <FiRotateCcw size={15} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleRedo}
            disabled={redoStack.length === 0 || isWon}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <FiRotateCw size={15} />
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleHint}
            disabled={isWon || !puzzle}
            title="Hint (H)"
          >
            <FiHelpCircle size={15} />
            <span>Hint {hintsUsed > 0 ? `(${hintsUsed})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Active Hint Banner */}
      {activeHint && (
        <div className={styles.hintBanner} role="status">
          <div className={styles.hintTextWrap}>
            <FiInfo size={16} />
            <span>{activeHint.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveHint(null)}
            className={styles.hintCloseBtn}
            aria-label="Dismiss hint"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {/* Board Area */}
      <div className={styles.boardWrapper}>
        {puzzle && (
          <div
            className={styles.board}
            style={{ '--board-size': size } as React.CSSProperties}
            role="grid"
            aria-label="Queens Puzzle Board"
          >
            {puzzle.regions.map((row, r) =>
              row.map((regionId, c) => {
                const cellVal = grid[r]?.[c] ?? 'empty';
                const theme = REGION_THEMES[regionId % REGION_THEMES.length];
                const borders = getCellBorders(r, c, size, puzzle.regions);
                const isConflict = conflictCellKeys.has(`${r},${c}`);
                const isHint = hintCellKeys.has(`${r},${c}`);
                const isFocused = focusedCell.r === r && focusedCell.c === c;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    tabIndex={0}
                    aria-label={`Row ${r + 1}, Column ${c + 1}, Region ${theme.name}, State: ${cellVal}`}
                    className={`
                      ${styles.cell}
                      ${isConflict ? styles.conflictCell : ''}
                      ${isHint ? styles.hintCell : ''}
                    `}
                    style={{
                      '--cell-bg': theme.bgLight,
                      '--border-top': borders.top ? `3px solid ${theme.borderLight}` : '1px solid rgba(0, 0, 0, 0.08)',
                      '--border-bottom': borders.bottom ? `3px solid ${theme.borderLight}` : '1px solid rgba(0, 0, 0, 0.08)',
                      '--border-left': borders.left ? `3px solid ${theme.borderLight}` : '1px solid rgba(0, 0, 0, 0.08)',
                      '--border-right': borders.right ? `3px solid ${theme.borderLight}` : '1px solid rgba(0, 0, 0, 0.08)',
                      '--cell-outline': isFocused ? '2px solid #3b82f6' : 'none',
                    } as React.CSSProperties}
                    onClick={() => handleCellTap(r, c)}
                  >
                    {cellVal === 'queen' && (
                      <FiAward className={styles.queenIcon} aria-label="Queen" />
                    )}
                    {cellVal === 'x' && (
                      <FiX className={styles.xMarker} aria-hidden="true" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Rules & Instructions Footer Card */}
      <section className={styles.instructionsCard}>
        <h2 className={styles.sectionHeading}>Rules & Objectives</h2>
        <ul className={styles.rulesList}>
          <li>Place <strong>exactly 1 Queen</strong> in every row.</li>
          <li>Place <strong>exactly 1 Queen</strong> in every column.</li>
          <li>Place <strong>exactly 1 Queen</strong> in every colored region.</li>
          <li>Queens <strong>cannot touch each other</strong>, even diagonally (must have at least one empty square between them).</li>
        </ul>
        <div className={styles.tipBox}>
          <strong>Controls Tip:</strong> Tap a square to place a Queen; tap it again to remove it.
        </div>
      </section>

      {/* Victory / Game Over Modal */}
      {isWon && (
        <GameOverModal
          outcome="won"
          gameTitle="Queens Puzzle"
          subtitle={`Solved in ${size}×${size} Grid`}
          timeSeconds={elapsedSeconds}
          scoreBreakdown={scoreBreakdown || undefined}
          isPersonalBest={personalBest}
          stats={[
            { label: 'Grid Size', value: `${size}×${size}` },
            { label: 'Time Taken', value: formatGameTime(elapsedSeconds) },
            { label: 'Moves Made', value: movesCount },
            { label: 'Hints Used', value: hintsUsed },
          ]}
          onPlayAgain={generateNewPuzzle}
          playAgainLabel="Play Fresh Puzzle"
          hubHref="/games"
        />
      )}

      {/* How to Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        gameTitle="Queens Puzzle"
        objective="Place exactly one Queen in each row, each column, and each color region without any two Queens touching horizontally, vertically, or diagonally."
        rules={[
          `Every row must contain exactly one Queen.`,
          `Every column must contain exactly one Queen.`,
          `Every colored region must contain exactly one Queen.`,
          `Queens cannot touch, even diagonally (Chebyshev distance > 1).`,
          `Every puzzle is procedurally generated with a guaranteed single unique answer.`,
        ]}
        controls={{
          desktop: 'Click a square to place or remove a Queen. Press "X" to mark a square. Arrow keys navigate.',
          mobile: 'Tap a square to place a Queen; tap it again to remove it.',
        }}
        tips={[
          'Start by placing X marks around placed Queens: all 8 neighboring squares are immediately invalid.',
          'When a region has only 1 available square remaining, a Queen must go there!',
          'If a row or column only has 1 spot left, place the Queen immediately.',
          'Use the Hint button anytime you are stuck to get a non-destructive logical deduction.',
        ]}
      />

      {/* Statistics Modal */}
      {showStatsModal && (
        <div className="modalOverlay" onClick={() => setShowStatsModal(false)}>
          <div className={`modalContent ${styles.statsModalContent}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.statsModalTitle}>
              <FiAward size={20} />
              <span>Queens Statistics</span>
            </h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statVal}>{stats.gamesPlayed}</div>
                <div className={styles.statLbl}>Played</div>
              </div>
              <div className={styles.statCard}>
                <div className={`${styles.statVal} ${styles.statValSuccess}`}>{stats.gamesWon}</div>
                <div className={styles.statLbl}>Won</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statVal}>
                  {stats.bestTime > 0 ? formatGameTime(stats.bestTime) : '--:--'}
                </div>
                <div className={styles.statLbl}>Best Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statVal}>{stats.currentStreak}</div>
                <div className={styles.statLbl}>Current Streak</div>
              </div>
            </div>
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.primaryActionBtn} ${styles.statsCloseBtn}`}
              onClick={() => setShowStatsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Quit Modal */}
      <QuitModal
        isOpen={showQuitModal}
        onCancel={() => setShowQuitModal(false)}
        gameTitle="Queens Puzzle"
        hubHref="/games"
      />
    </GameShell>
  );
};

export default QueensGame;
