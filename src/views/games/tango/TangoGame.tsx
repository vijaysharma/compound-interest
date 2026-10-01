'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiClock,
  FiHelpCircle,
  FiRotateCcw,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { TANGO_PRESETS } from './presets';
import { getTangoHint, validateTango } from './engine';
import type { TangoCellVal, TangoDifficulty, TangoMove } from './types';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { HowToPlayButton, HowToPlayModal } from '../common/HowToPlayModal';
import { formatGameTime, recordGameScore } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import { getUserAppStateAction, saveUserAppStateAction } from '@/actions/userAppState';
import { getAuthToken, getOrCreateGuestId } from '@/utilities/clientSession';
import styles from './TangoGame.module.scss';

const STORAGE_KEY = 'rupee_calc_tango_state';

type TapMode = 'cycle' | 'primary' | 'light';

interface SavedTangoState {
  difficulty: TangoDifficulty;
  puzzleIndex: number;
  grid: TangoCellVal[][];
  elapsedSeconds: number;
  hintsUsed: number;
  isComplete: boolean;
}

export const TangoGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<TangoDifficulty>('easy');
  const [puzzleIndex, setPuzzleIndex] = useState<number>(0);

  const presetsList = TANGO_PRESETS[difficulty];
  const activePreset = presetsList[puzzleIndex % presetsList.length];
  const size = activePreset.size;

  // Initialize board from preset
  const [grid, setGrid] = useState<TangoCellVal[][]>(() =>
    activePreset.initialGrid.map((row) => [...row] as TangoCellVal[])
  );
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

  // Validation output
  const validation = useMemo(() => {
    return validateTango(grid, activePreset);
  }, [grid, activePreset]);

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

  // Restore saved state
  useEffect(() => {
    let active = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedTangoState = JSON.parse(raw);
        if (saved && saved.difficulty && Array.isArray(saved.grid)) {
          requestAnimationFrame(() => {
            if (!active) return;
            setDifficulty(saved.difficulty);
            setPuzzleIndex(saved.puzzleIndex || 0);
            setGrid(saved.grid);
            setElapsedSeconds(saved.elapsedSeconds || 0);
            setHintsUsed(saved.hintsUsed || 0);
            setIsComplete(saved.isComplete || false);
            setIsStarted((saved.elapsedSeconds || 0) > 0);
          });
        }
      }
    } catch {
      // Ignore
    }

    const token = getAuthToken();
    const guestId = getOrCreateGuestId();
    void getUserAppStateAction<SavedTangoState>(token, guestId, 'games', 'tango').then((res) => {
      if (active && res.success && res.payload) {
        const saved = res.payload;
        if (saved.difficulty && Array.isArray(saved.grid)) {
          setDifficulty(saved.difficulty);
          setPuzzleIndex(saved.puzzleIndex || 0);
          setGrid(saved.grid);
          setElapsedSeconds(saved.elapsedSeconds || 0);
          setHintsUsed(saved.hintsUsed || 0);
          setIsComplete(saved.isComplete || false);
          setIsStarted((saved.elapsedSeconds || 0) > 0);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Save state
  useEffect(() => {
    const stateToSave: SavedTangoState = {
      difficulty,
      puzzleIndex,
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
  }, [difficulty, puzzleIndex, grid, hintsUsed, isComplete]);

  // Reset / Next game
  const resetGame = useCallback(
    (newDiff?: TangoDifficulty, newPuzzleIdx?: number) => {
      const targetDiff = newDiff ?? difficulty;
      const targetList = TANGO_PRESETS[targetDiff];
      const targetIdx = (newPuzzleIdx ?? puzzleIndex) % targetList.length;
      const preset = targetList[targetIdx];

      setDifficulty(targetDiff);
      setPuzzleIndex(targetIdx);
      setGrid(preset.initialGrid.map((row) => [...row] as TangoCellVal[]));
      setHistory([]);
      setElapsedSeconds(0);
      setIsStarted(false);
      setIsComplete(false);
      setHintsUsed(0);
      setPersonalBest(false);
      setScoreBreakdown(null);
      setActiveHint(null);
    },
    [difficulty, puzzleIndex]
  );

  const handleDifficultyChange = (newDiff: TangoDifficulty) => {
    if (newDiff === difficulty) return;
    resetGame(newDiff, 0);
  };

  const handleNextPuzzle = () => {
    const nextIdx = (puzzleIndex + 1) % presetsList.length;
    resetGame(difficulty, nextIdx);
  };

  // Cell interaction
  const handleCellClick = (r: number, c: number) => {
    if (isComplete) return;
    // Don't modify initial given clues
    if (activePreset.initialGrid[r][c] !== 0) return;

    if (!isStarted) setIsStarted(true);
    setActiveHint(null);

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

    setHistory((prev) => [...prev, { row: r, col: c, from: current, to: next }]);
    setGrid((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[r][c] = next;
      return updated;
    });
  };

  // Right-click or alternate tap to place Light circle directly in cycle mode
  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (isComplete) return;
    if (activePreset.initialGrid[r][c] !== 0) return;

    if (!isStarted) setIsStarted(true);
    setActiveHint(null);

    const current = grid[r][c];
    const next: TangoCellVal = current === 2 ? 0 : 2;

    setHistory((prev) => [...prev, { row: r, col: c, from: current, to: next }]);
    setGrid((prev) => {
      const updated = prev.map((row) => [...row]);
      updated[r][c] = next;
      return updated;
    });
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
  };

  // Hint button
  const handleHint = () => {
    if (isComplete) return;
    if (!isStarted) setIsStarted(true);
    const hint = getTangoHint(grid, activePreset);
    if (hint) {
      setHintsUsed((prev) => prev + 1);
      setActiveHint(hint);
    }
  };

  // Quick fill from hint
  const applyHint = () => {
    if (!activeHint || isComplete) return;
    const { row, col, suggestedVal } = activeHint;
    const current = grid[row][col];
    setHistory((prev) => [...prev, { row, col, from: current, to: suggestedVal }]);
    setGrid((prev) => {
      const updated = prev.map((r) => [...r]);
      updated[row][col] = suggestedVal;
      return updated;
    });
    setActiveHint(null);
  };

  // Count placed cells
  const placedCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0) count++;
      }
    }
    return count;
  }, [grid, size]);

  const totalCells = size * size;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Tango (Binairo)</h1>
          <p className={styles.subtitle}>Fill the grid with primary & light circles</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <HowToPlayButton onClick={() => setShowHowToPlay(true)} />
          <QuitButton onClick={() => setShowQuitModal(true)} />
        </div>
      </header>

      {/* HUD Bar */}
      <div className={styles.hudBar}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Difficulty</span>
          <span className={styles.hudValue} style={{ textTransform: 'capitalize' }}>
            {difficulty} ({size}×{size})
          </span>
        </div>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Filled</span>
          <span className={styles.hudValue}>
            {placedCount} / {totalCells}
          </span>
        </div>
        <div className={styles.timerBadge}>
          <FiClock />
          <span>{formatGameTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Top Controls: Difficulty and Puzzle Selector */}
      <div className={styles.topControls}>
        <div className={styles.difficultySelector}>
          {(['easy', 'medium', 'hard'] as TangoDifficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              className={`${styles.diffBtn} ${difficulty === d ? styles.diffBtnActive : ''}`}
              onClick={() => handleDifficultyChange(d)}
            >
              {d === 'easy' ? 'Easy (6×6)' : d === 'medium' ? 'Medium (8×8)' : 'Hard (10×10)'}
            </button>
          ))}
        </div>
        <div className={styles.puzzleSwitcher}>
          <button
            type="button"
            className={styles.puzzleBtn}
            onClick={handleNextPuzzle}
            title="Next Puzzle in this Difficulty"
          >
            <FiRotateCcw size={13} />
            <span>Next Puzzle ({puzzleIndex + 1}/{presetsList.length})</span>
          </button>
        </div>
      </div>

      {/* Active Hint Banner */}
      {activeHint && (
        <div className={styles.hintBanner}>
          <FiHelpCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span>{activeHint.explanation}</span>
            <button
              type="button"
              onClick={applyHint}
              style={{
                marginLeft: '8px',
                padding: '2px 8px',
                borderRadius: '6px',
                border: 'none',
                background: '#d97706',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Game Board Card */}
      <div className={styles.boardCard}>
        <div className={styles.gridContainer}>
          <div
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
          >
            {grid.map((row, r) =>
              row.map((val, c) => {
                const isFixed = activePreset.initialGrid[r][c] !== 0;
                const isConflict = conflictCellKeys.has(`${r}-${c}`);
                const isHinted = activeHint?.row === r && activeHint?.col === c;

                // Find constraints originating here
                const hSign = activePreset.horizontalSigns.find(
                  (s) => s.row === r && s.col === c
                );
                const vSign = activePreset.verticalSigns.find(
                  (s) => s.row === r && s.col === c
                );

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`
                      ${styles.cell}
                      ${isFixed ? styles.cellFixed : ''}
                      ${isConflict ? styles.cellConflict : ''}
                      ${isHinted ? styles.cellHinted : ''}
                    `}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleContextMenu(e, r, c)}
                    role="button"
                    aria-label={`Row ${r + 1}, Column ${c + 1}`}
                  >
                    {val === 1 && (
                      <div
                        className={`${styles.circlePrimary} ${isFixed ? styles.circleFixed : ''}`}
                      />
                    )}
                    {val === 2 && (
                      <div
                        className={`${styles.circleLight} ${isFixed ? styles.circleFixed : ''}`}
                      />
                    )}

                    {/* Horizontal Sign (= or x) */}
                    {hSign && (
                      <span className={styles.hSign}>
                        {hSign.sign === '=' ? '=' : '×'}
                      </span>
                    )}

                    {/* Vertical Sign (= or x) */}
                    {vSign && (
                      <span className={styles.vSign}>
                        {vSign.sign === '=' ? '=' : '×'}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Tap Mode Switcher (Cycle / Primary / Light) */}
      <div className={styles.modeSelector}>
        <button
          type="button"
          className={`${styles.modeBtn} ${tapMode === 'cycle' ? styles.modeBtnActive : ''}`}
          onClick={() => setTapMode('cycle')}
        >
          <span>Cycle (3-way)</span>
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${tapMode === 'primary' ? styles.modeBtnActive : ''}`}
          onClick={() => setTapMode('primary')}
        >
          <span className={styles.modeCirclePrimary} />
          <span>Primary</span>
        </button>
        <button
          type="button"
          className={`${styles.modeBtn} ${tapMode === 'light' ? styles.modeBtnActive : ''}`}
          onClick={() => setTapMode('light')}
        >
          <span className={styles.modeCircleLight} />
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
          <FiRotateCcw size={15} />
          <span>Undo</span>
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.hintBtn}`}
          onClick={handleHint}
          disabled={isComplete}
        >
          <FiHelpCircle size={15} />
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
          {rulesOpen ? <FiChevronUp /> : <FiChevronDown />}
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
                Cells separated by an <strong>=</strong> sign must be of the <strong>same</strong> type.
              </li>
              <li>
                Cells separated by an <strong>×</strong> sign must be of the <strong>opposite</strong> type.
              </li>
              <li>
                Each puzzle has one right answer and can be solved completely via deduction (no guessing needed).
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* See Results / Completion Button */}
      <button
        type="button"
        className={styles.resultsBtn}
        onClick={() => {
          if (validation.isComplete) {
            setIsComplete(true);
          } else {
            alert(
              validation.violations.length > 0
                ? validation.violations[0].message
                : `Please complete all cells to verify results (${placedCount}/${totalCells} placed).`
            );
          }
        }}
      >
        {validation.isComplete ? '🎉 View Victory Results' : 'Check Progress'}
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
          playAgainLabel="Next Puzzle"
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
          'Unique lines: Every row must be unique and every column must be unique.',
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
        ]}
      />

      {/* Quit Modal */}
      <QuitModal
        isOpen={showQuitModal}
        onCancel={() => setShowQuitModal(false)}
        gameTitle="Tango"
        hubHref="/games"
      />
    </div>
  );
};

export default TangoGame;
