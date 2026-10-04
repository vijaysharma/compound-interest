'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAward,
  FiClock,
  FiHelpCircle,
  FiRotateCcw,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { getTangoHint, validateTango } from './engine';
import { TANGO_SIZE, generateTangoPuzzle } from './generator';
import type { TangoCellVal, TangoDifficulty, TangoMove, TangoPreset } from './types';
import { GameShell } from '../common/GameShell';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { HowToPlayButton, HowToPlayModal } from '../common/HowToPlayModal';
import { formatGameTime, recordGameScore } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
import styles from './TangoGame.module.scss';
const STORAGE_KEY = 'rupee_calc_tango_state';
const RECENT_KEY = 'rupee_calc_tango_recent';
const RECENT_LIMIT = 40;
const DIFFICULTIES: TangoDifficulty[] = ['easy', 'medium', 'hard'];
type TapMode = 'cycle' | 'primary' | 'light';
interface SavedTangoState {
  difficulty: TangoDifficulty;
  puzzle?: TangoPreset;
  grid: TangoCellVal[][];
  elapsedSeconds: number;
  hintsUsed: number;
  isComplete: boolean;
}
const readRecentSignatures = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
};
const createPuzzle = (difficulty: TangoDifficulty): TangoPreset => {
  const recent = readRecentSignatures();
  const puzzle = generateTangoPuzzle({ difficulty, avoidSignatures: recent });
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([puzzle.signature, ...recent].slice(0, RECENT_LIMIT)));
  } catch {
    // Ignore
  }
  return {
    id: puzzle.id,
    title: puzzle.title,
    size: puzzle.size,
    initialGrid: puzzle.initialGrid,
    solution: puzzle.solution,
    horizontalSigns: puzzle.horizontalSigns,
    verticalSigns: puzzle.verticalSigns,
  };
};
const isSquare = (g: unknown, size: number): g is number[][] =>
  Array.isArray(g) && g.length === size && g.every((row) => Array.isArray(row) && row.length === size);
const isRestorable = (saved: SavedTangoState | null | undefined): saved is SavedTangoState & { puzzle: TangoPreset } => {
  if (!saved || !DIFFICULTIES.includes(saved.difficulty) || !saved.puzzle) return false;
  const p = saved.puzzle;
  return (
    typeof p.size === 'number' &&
    isSquare(p.initialGrid, p.size) &&
    isSquare(p.solution, p.size) &&
    isSquare(saved.grid, p.size) &&
    Array.isArray(p.horizontalSigns) &&
    Array.isArray(p.verticalSigns)
  );
};
const cellName = (val: TangoCellVal): string => (val === 1 ? 'Primary circle' : val === 2 ? 'Light circle' : 'Empty');
const SignGlyph: React.FC<{ sign: '=' | 'x' }> = ({ sign }) => (
  <svg viewBox="0 0 24 24" className={styles.signGlyph} aria-hidden="true" focusable="false">
    {sign === '=' ? (
      <>
        <line x1="5" y1="8.5" x2="19" y2="8.5" />
        <line x1="5" y1="15.5" x2="19" y2="15.5" />
      </>
    ) : (
      <>
        <line x1="6.5" y1="6.5" x2="17.5" y2="17.5" />
        <line x1="17.5" y1="6.5" x2="6.5" y2="17.5" />
      </>
    )}
  </svg>
);
export const TangoGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<TangoDifficulty>('easy');
  const [puzzle, setPuzzle] = useState<TangoPreset | null>(null);
  const size = puzzle?.size ?? TANGO_SIZE;
  const [grid, setGrid] = useState<TangoCellVal[][]>([]);
  const [history, setHistory] = useState<TangoMove[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [tapMode, setTapMode] = useState<TapMode>('cycle');
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(true);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const elapsedSecondsRef = useRef<number>(elapsedSeconds);
  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);
  const [activeHint, setActiveHint] = useState<{
    row: number;
    col: number;
    suggestedVal: TangoCellVal;
    explanation: string;
  } | null>(null);
  const isReady = puzzle !== null && grid.length === puzzle.size;
  // Validation output
  const validation = useMemo(() => {
    if (!puzzle || grid.length !== puzzle.size) return { isValid: true, isComplete: false, violations: [] };
    return validateTango(grid, puzzle);
  }, [grid, puzzle]);
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
  // Sign lookups: markers drawn on the right / bottom edge of their origin cell, plus labels for both cells.
  const signInfo = useMemo(() => {
    const right = new Map<string, '=' | 'x'>();
    const down = new Map<string, '=' | 'x'>();
    const labels = new Map<string, string[]>();
    const addLabel = (key: string, text: string) => labels.set(key, [...(labels.get(key) ?? []), text]);
    const word = (sign: '=' | 'x') => (sign === '=' ? 'same as' : 'opposite to');
    for (const s of puzzle?.horizontalSigns ?? []) {
      right.set(`${s.row}-${s.col}`, s.sign);
      addLabel(`${s.row}-${s.col}`, `${word(s.sign)} the cell to the right`);
      addLabel(`${s.row}-${s.col + 1}`, `${word(s.sign)} the cell to the left`);
    }
    for (const s of puzzle?.verticalSigns ?? []) {
      down.set(`${s.row}-${s.col}`, s.sign);
      addLabel(`${s.row}-${s.col}`, `${word(s.sign)} the cell below`);
      addLabel(`${s.row + 1}-${s.col}`, `${word(s.sign)} the cell above`);
    }
    return { right, down, labels };
  }, [puzzle]);
  // Auto-win check when board state changes
  useEffect(() => {
    if (!isComplete && validation.isComplete && isStarted) {
      const res = recordGameScore({
        gameId: 'tango',
        gameName: 'Tango (Binairo)',
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
  const applySaved = useCallback((saved: SavedTangoState & { puzzle: TangoPreset }) => {
    setDifficulty(saved.difficulty);
    setPuzzle(saved.puzzle);
    setGrid(saved.grid.map((row) => [...row] as TangoCellVal[]));
    setHistory([]);
    setElapsedSeconds(saved.elapsedSeconds || 0);
    setHintsUsed(saved.hintsUsed || 0);
    setIsComplete(saved.isComplete || false);
    setIsStarted((saved.elapsedSeconds || 0) > 0);
  }, []);
  // Restore saved state, or generate a fresh puzzle (legacy preset-index saves are discarded)
  useEffect(() => {
    let active = true;
    let saved: SavedTangoState | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      saved = raw ? (JSON.parse(raw) as SavedTangoState) : null;
    } catch {
      saved = null;
    }
    const frame = requestAnimationFrame(() => {
      if (!active) return;
      if (isRestorable(saved)) {
        applySaved(saved);
        return;
      }
      const diff = saved && DIFFICULTIES.includes(saved.difficulty) ? saved.difficulty : 'easy';
      const fresh = createPuzzle(diff);
      setDifficulty(diff);
      setPuzzle(fresh);
      setGrid(fresh.initialGrid.map((row) => [...row] as TangoCellVal[]));
    });
    const token = getAuthToken();
    const guestId = getOrCreateGuestId();
    void getUserAppStateAction<SavedTangoState>(token, guestId, 'games', 'tango').then((res) => {
      if (active && res.success && isRestorable(res.payload)) {
        applySaved(res.payload);
      }
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [applySaved]);
  // Save state
  useEffect(() => {
    if (!puzzle || grid.length !== puzzle.size) return;
    const stateToSave: SavedTangoState = {
      difficulty,
      puzzle,
      grid,
      elapsedSeconds: elapsedSecondsRef.current,
      hintsUsed,
      isComplete,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore
    }
    const timeout = setTimeout(() => {
      const token = getAuthToken();
      const guestId = getOrCreateGuestId();
      void saveUserAppStateAction(token, guestId, 'games', 'tango', stateToSave);
    }, 600);
    return () => clearTimeout(timeout);
  }, [difficulty, puzzle, grid, hintsUsed, isComplete]);
  // New game: always a freshly generated puzzle (generation takes a few ms, ~50ms worst case on hard)
  const startNewPuzzle = useCallback((targetDiff: TangoDifficulty) => {
    const fresh = createPuzzle(targetDiff);
    setDifficulty(targetDiff);
    setPuzzle(fresh);
    setGrid(fresh.initialGrid.map((row) => [...row] as TangoCellVal[]));
    setHistory([]);
    setElapsedSeconds(0);
    setIsStarted(false);
    setIsComplete(false);
    setHintsUsed(0);
    setPersonalBest(false);
    setScoreBreakdown(null);
    setActiveHint(null);
    setProgressMessage(null);
  }, []);
  const handleDifficultyChange = (newDiff: TangoDifficulty) => {
    if (newDiff === difficulty) return;
    startNewPuzzle(newDiff);
  };
  const handleNextPuzzle = () => {
    startNewPuzzle(difficulty);
  };
  const setCell = (r: number, c: number, next: TangoCellVal) => {
    const current = grid[r][c];
    if (current === next) return;
    setHistory((prev) => [...prev, { row: r, col: c, from: current, to: next }]);
    setGrid((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[r][c] = next;
      return updated;
    });
  };
  // Cell interaction
  const handleCellClick = (r: number, c: number) => {
    if (isComplete || !puzzle) return;
    // Don't modify initial given clues
    if (puzzle.initialGrid[r][c] !== 0) return;
    if (!isStarted) setIsStarted(true);
    setActiveHint(null);
    setProgressMessage(null);
    const current = grid[r][c];
    let next: TangoCellVal;
    if (tapMode === 'primary') {
      next = current === 1 ? 0 : 1;
    } else if (tapMode === 'light') {
      next = current === 2 ? 0 : 2;
    } else {
      // Cycle: 0 (empty) -> 1 (Primary) -> 2 (Light) -> 0 (empty)
      if (current === 0) next = 1;
      else if (current === 1) next = 2;
      else next = 0;
    }
    setCell(r, c, next);
  };
  // Right-click to place Light circle directly in cycle mode
  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (isComplete || !puzzle) return;
    if (puzzle.initialGrid[r][c] !== 0) return;
    if (!isStarted) setIsStarted(true);
    setActiveHint(null);
    setProgressMessage(null);
    setCell(r, c, grid[r][c] === 2 ? 0 : 2);
  };
  // Undo move
  const handleUndo = () => {
    if (history.length === 0 || isComplete) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGrid((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[last.row][last.col] = last.from;
      return updated;
    });
    setProgressMessage(null);
  };
  // Hint button
  const handleHint = () => {
    if (isComplete || !puzzle) return;
    if (!isStarted) setIsStarted(true);
    const hint = getTangoHint(grid, puzzle);
    if (hint) {
      setHintsUsed((prev) => prev + 1);
      setActiveHint(hint);
    }
  };
  // Quick fill from hint
  const applyHint = () => {
    if (!activeHint || isComplete) return;
    const { row, col, suggestedVal } = activeHint;
    setCell(row, col, suggestedVal);
    setActiveHint(null);
  };
  // Count placed cells
  const placedCount = useMemo(() => {
    let count = 0;
    for (const row of grid) {
      for (const v of row) {
        if (v !== 0) count++;
      }
    }
    return count;
  }, [grid]);
  const totalCells = size * size;
  const handleCheckProgress = () => {
    if (validation.isComplete) {
      setIsComplete(true);
      return;
    }
    setProgressMessage(
      validation.violations.length > 0
        ? validation.violations[0].message
        : `Looking good so far — complete all cells to finish (${placedCount}/${totalCells} placed).`
    );
  };
  return (
    <GameShell className={styles.container}>
      {/* Header */}
      <GameShell.Header
        title="Tango (Binairo)"
        subtitle="Fill the grid with primary & light circles"
        actions={
          <div className={styles.headerActions}>
            <HowToPlayButton onClick={() => setShowHowToPlay(true)} />
            <QuitButton onClick={() => setShowQuitModal(true)} />
          </div>
        }
      />
      {/* HUD Bar */}
      <div className={styles.hudBar}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Difficulty</span>
          <span className={`${styles.hudValue} ${styles.capitalize}`}>
            {difficulty} ({size}×{size})
          </span>
        </div>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Filled</span>
          <span className={styles.hudValue}>
            {placedCount} / {totalCells}
          </span>
        </div>
        <div className={styles.timerBadge} aria-label={`Elapsed time ${formatGameTime(elapsedSeconds)}`}>
          <FiClock aria-hidden="true" />
          <span>{formatGameTime(elapsedSeconds)}</span>
        </div>
      </div>
      {/* Top Controls: Difficulty and New Puzzle */}
      <div className={styles.topControls}>
        <div className={styles.difficultySelector} role="group" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.diffBtn} ${difficulty === d ? styles.diffBtnActive : ''}`}
              onClick={() => handleDifficultyChange(d)}
              aria-pressed={difficulty === d}
            >
              {d === 'easy' ? 'Easy' : d === 'medium' ? 'Medium' : 'Hard'}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.puzzleBtn}
          onClick={handleNextPuzzle}
          aria-label={`Generate a new ${difficulty} puzzle`}
        >
          <FiRefreshCw size={16} aria-hidden="true" />
          <span>New Puzzle</span>
        </button>
      </div>
      {/* Active Hint Banner */}
      {activeHint && (
        <div className={styles.hintBanner} role="status">
          <FiHelpCircle size={18} className={styles.hintIcon} aria-hidden="true" />
          <span className={styles.hintText}>{activeHint.explanation}</span>
          <button type="button" onClick={applyHint} className={styles.hintApplyBtn}>
            Apply
          </button>
        </div>
      )}
      {/* Game Board Card */}
      <div className={styles.boardCard}>
        <div className={styles.gridContainer}>
          <div
            className={styles.grid}
            role="group"
            aria-label={`Tango board, ${size} by ${size}`}
            aria-busy={!isReady}
          >
            {!isReady && <div className={styles.generating}>Generating puzzle…</div>}
            {isReady &&
              grid.map((row, r) =>
                row.map((val, c) => {
                  const key = `${r}-${c}`;
                  const isFixed = puzzle.initialGrid[r][c] !== 0;
                  const isConflict = conflictCellKeys.has(key);
                  const isHinted = activeHint?.row === r && activeHint?.col === c;
                  const hSign = signInfo.right.get(key);
                  const vSign = signInfo.down.get(key);
                  const signLabels = signInfo.labels.get(key);
                  const label = [
                    `Row ${r + 1}, column ${c + 1}: ${cellName(val)}`,
                    isFixed ? 'given, locked' : null,
                    isConflict ? 'breaks a rule' : null,
                    signLabels?.length ? `must be ${signLabels.join(' and ')}` : null,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <button
                      key={key}
                      type="button"
                      className={[
                        styles.cell,
                        isFixed ? styles.cellFixed : '',
                        isConflict ? styles.cellConflict : '',
                        isHinted ? styles.cellHinted : '',
                      ].join(' ')}
                      onClick={() => handleCellClick(r, c)}
                      onContextMenu={(e) => handleContextMenu(e, r, c)}
                      aria-label={label}
                      aria-disabled={isFixed || isComplete}
                    >
                      {val === 1 && (
                        <span
                          className={`${styles.circlePrimary} ${isFixed ? styles.circleFixed : ''}`}
                          aria-hidden="true"
                        />
                      )}
                      {val === 2 && (
                        <span
                          className={`${styles.circleLight} ${isFixed ? styles.circleFixed : ''}`}
                          aria-hidden="true"
                        />
                      )}
                      {/* Horizontal Sign (= or ×) between this cell and the one to the right */}
                      {hSign && (
                        <span className={`${styles.sign} ${styles.hSign}`} aria-hidden="true">
                          <SignGlyph sign={hSign} />
                        </span>
                      )}
                      {/* Vertical Sign (= or ×) between this cell and the one below */}
                      {vSign && (
                        <span className={`${styles.sign} ${styles.vSign}`} aria-hidden="true">
                          <SignGlyph sign={vSign} />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
          </div>
        </div>
      </div>
      {/* Tap Mode Switcher (Cycle / Primary / Light) */}
      <div className={styles.modeSelector} role="group" aria-label="Tap mode">
        <button
          type="button"
          className={`${styles.modeBtn} ${tapMode === 'cycle' ? styles.modeBtnActive : ''}`}
          onClick={() => setTapMode('cycle')}
          aria-pressed={tapMode === 'cycle'}
        >
          <span>Cycle</span>
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${tapMode === 'primary' ? styles.modeBtnActive : ''}`}
          onClick={() => setTapMode('primary')}
          aria-pressed={tapMode === 'primary'}
        >
          <span className={styles.modeCirclePrimary} aria-hidden="true" />
          <span>Primary</span>
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${tapMode === 'light' ? styles.modeBtnActive : ''}`}
          onClick={() => setTapMode('light')}
          aria-pressed={tapMode === 'light'}
        >
          <span className={styles.modeCircleLight} aria-hidden="true" />
          <span>Light</span>
        </button>
      </div>
      {/* Action Buttons: Undo & Hint */}
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={handleUndo}
          disabled={history.length === 0 || isComplete}
        >
          <FiRotateCcw size={16} aria-hidden="true" />
          <span>Undo</span>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.hintBtn}`}
          onClick={handleHint}
          disabled={isComplete || !isReady}
        >
          <FiHelpCircle size={16} aria-hidden="true" />
          <span>Hint</span>
        </button>
      </div>
      {/* Rules Accordion */}
      <div className={styles.rulesAccordion}>
        <button
          type="button"
          className={styles.rulesHeader}
          onClick={() => setRulesOpen((prev) => !prev)}
          aria-expanded={rulesOpen}
        >
          <span>How to play</span>
          {rulesOpen ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
        </button>
        {rulesOpen && (
          <div className={styles.rulesContent}>
            <ul>
              <li>
                Fill the grid so that each cell contains either a{' '}
                <span className={styles.ruleCirclePrimary} /> Primary or a{' '}
                <span className={styles.ruleCircleLight} /> Light circle.
              </li>
              <li>
                No more than 2 of the same circle may be next to each other, either vertically or
                horizontally.
              </li>
              <li>
                Each row and column must contain the same number of{' '}
                <span className={styles.ruleCirclePrimary} /> and{' '}
                <span className={styles.ruleCircleLight} /> circles ({size / 2} each).
              </li>
              <li>
                Cells separated by an <span className={`${styles.sign} ${styles.ruleSign}`}><SignGlyph sign="=" /></span> sign must be of the <strong>same</strong> type.
              </li>
              <li>
                Cells separated by an <span className={`${styles.sign} ${styles.ruleSign}`}><SignGlyph sign="x" /></span> sign must be of the <strong>opposite</strong> type.
              </li>
              <li>
                Every puzzle is freshly generated, has exactly one answer, and can be solved by deduction (no guessing).
                Easy needs only the direct rules, Medium needs whole-row/column reasoning, Hard needs a short &ldquo;what if&rdquo; lookahead.
              </li>
            </ul>
          </div>
        )}
      </div>
      {progressMessage && (
        <p className={styles.progressMessage} role="status" aria-live="polite">
          {progressMessage}
        </p>
      )}
      {/* See Results / Completion Button */}
      <button type="button" className={styles.resultsBtn} onClick={handleCheckProgress} disabled={!isReady}>
        {validation.isComplete ? (
          <>
            <FiAward aria-hidden="true" /> View Victory Results
          </>
        ) : (
          'Check Progress'
        )}
      </button>
      {/* Game Over Modal */}
      {isComplete && (
        <GameOverModal
          outcome="won"
          gameTitle="Tango (Binairo)"
          subtitle={`Difficulty: ${difficulty.toUpperCase()} (${size}×${size})`}
          timeSeconds={elapsedSeconds}
          scoreBreakdown={scoreBreakdown || undefined}
          isPersonalBest={personalBest}
          stats={[
            { label: 'Grid Size', value: `${size}×${size}` },
            { label: 'Time Taken', value: formatGameTime(elapsedSeconds) },
            { label: 'Hints Used', value: hintsUsed },
          ]}
          onPlayAgain={handleNextPuzzle}
          playAgainLabel="New Puzzle"
          hubHref="/games"
        />
      )}
      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        gameTitle="Tango (Binairo / Takuzu)"
        objective="Deduce and place primary and light circles such that every line is balanced and all sign constraints are fulfilled."
        rules={[
          'Fill every cell with either a Primary or Light circle.',
          'No 3 in a row: You cannot have 3 identical circles consecutive horizontally or vertically.',
          `Equal balance: Every row and column must contain exactly ${size / 2} Primary and ${size / 2} Light circles.`,
          'Equal sign (=): The two adjacent cells must have the same circle color.',
          'Cross sign (×): The two adjacent cells must have opposite circle colors.',
          'Every puzzle is randomly generated with exactly one solution (rows and columns in it are all distinct).',
        ]}
        controls={{
          desktop: 'Click to cycle (Empty → Primary → Light → Empty), or right-click to place Light circle directly.',
          mobile: 'Tap cells to cycle colors, or select a dedicated color mode from the toolbar.',
        }}
        tips={[
          'Look for two adjacent identical circles: both ends must be the opposite color.',
          'Look for two identical circles with one space between them: the middle cell must be the opposite color.',
          'Use = and × signs immediately to link pairs of cells.',
          'When a row or column reaches its quota of one color, fill all remaining cells with the other color.',
          'Medium/Hard: list the few ways a row can still be completed — cells that agree in every option are forced.',
        ]}
      />
      {/* Quit Modal */}
      <QuitModal
        isOpen={showQuitModal}
        onCancel={() => setShowQuitModal(false)}
        gameTitle="Tango"
        hubHref="/games"
      />
    </GameShell>
  );
};
export default TangoGame;
