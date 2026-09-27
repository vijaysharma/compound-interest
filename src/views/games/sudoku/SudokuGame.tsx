'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiClock, FiEdit2, FiHelpCircle, FiPause, FiPlay, FiRefreshCw, FiRotateCcw, FiTrash2 } from 'react-icons/fi';
import { PRESET_SUDOKU } from './presets';
import { generatePuzzle } from './generator';
import type { SudokuDifficulty, SudokuMove, SudokuState } from './types';
import { VictoryBanner } from '../common/VictoryBanner';
import { recordGameScore } from '../common/leaderboardStorage';
import styles from './SudokuGame.module.scss';
const STORAGE_KEY = 'rupee_calc_sudoku_state';
function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
export const SudokuGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy');
  const [initialGrid, setInitialGrid] = useState<number[][]>(PRESET_SUDOKU.easy.initial);
  const [solutionGrid, setSolutionGrid] = useState<number[][]>(PRESET_SUDOKU.easy.solution);
  const [grid, setGrid] = useState<number[][]>(() => PRESET_SUDOKU.easy.initial.map((r) => [...r]));
  const [notes, setNotes] = useState<Record<string, number[]>>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>({ row: 0, col: 0 });
  const [isPencilMode, setIsPencilMode] = useState<boolean>(false);
  const [history, setHistory] = useState<SudokuMove[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  // Restore saved state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SudokuState = JSON.parse(raw);
        if (saved && saved.grid && saved.solution && saved.initial) {
          requestAnimationFrame(() => {
            setDifficulty(saved.difficulty || 'easy');
            setInitialGrid(saved.initial);
            setSolutionGrid(saved.solution);
            setGrid(saved.grid);
            setNotes(saved.notes || {});
            setElapsedSeconds(saved.elapsedSeconds || 0);
            setIsComplete(saved.isComplete || false);
            setHintsUsed(saved.hintsUsed || 0);
          });
        }
      }
    } catch {
      // Ignore storage error
    }
  }, []);
  // Persist state
  useEffect(() => {
    try {
      const stateToSave: SudokuState = {
        grid,
        solution: solutionGrid,
        initial: initialGrid,
        notes,
        difficulty,
        elapsedSeconds,
        isPaused,
        isComplete,
        hintsUsed,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage error
    }
  }, [grid, solutionGrid, initialGrid, notes, difficulty, elapsedSeconds, isPaused, isComplete, hintsUsed]);
  // Timer effect
  useEffect(() => {
    if (isPaused || isComplete) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isComplete]);
  // Number counts (how many 1-9 are already placed on board)
  const numberCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = grid[r]?.[c] || 0;
        if (val >= 1 && val <= 9) counts[val] = (counts[val] || 0) + 1;
      }
    }
    return counts;
  }, [grid]);
  // Check board completion
  const checkCompletion = useCallback((currentGrid: number[][], solution: number[][]): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentGrid[r][c] === 0 || currentGrid[r][c] !== solution[r][c]) {
          return false;
        }
      }
    }
    return true;
  }, []);
  const startNewGame = useCallback((diff: SudokuDifficulty) => {
    const newBoard = generatePuzzle(diff);
    setDifficulty(diff);
    setInitialGrid(newBoard.initial);
    setSolutionGrid(newBoard.solution);
    setGrid(newBoard.initial.map((r) => [...r]));
    setNotes({});
    setHistory([]);
    setSelectedCell({ row: 0, col: 0 });
    setElapsedSeconds(0);
    setIsPaused(false);
    setIsComplete(false);
    setHintsUsed(0);
    setPersonalBest(false);
  }, []);
  const triggerWin = useCallback(
    (seconds: number) => {
      setIsComplete(true);
      const res = recordGameScore({
        gameId: 'sudoku',
        gameName: 'Sudoku',
        difficulty,
        timeSeconds: seconds,
        accuracy: '100%',
      });
      setPersonalBest(res.isPersonalBest);
    },
    [difficulty]
  );
  const handleCellClick = (r: number, c: number) => {
    if (isPaused) setIsPaused(false);
    setSelectedCell({ row: r, col: c });
  };
  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || isPaused || isComplete) return;
    const { row, col } = selectedCell;
    if (initialGrid[row]?.[col] !== 0) return;
    const key = `${row}-${col}`;
    const prevVal = grid[row][col];
    const prevCellNotes = notes[key] ? [...notes[key]] : [];
    if (isPencilMode) {
      if (prevVal !== 0) return;
      const nextNotes = prevCellNotes.includes(num)
        ? prevCellNotes.filter((n) => n !== num)
        : [...prevCellNotes, num].sort((a, b) => a - b);
      setHistory((prev) => [
        ...prev,
        {
          row,
          col,
          prevValue: prevVal,
          nextValue: prevVal,
          prevNotes: prevCellNotes,
          nextNotes,
        },
      ]);
      setNotes((prev) => ({ ...prev, [key]: nextNotes }));
      return;
    }
    const nextVal = prevVal === num ? 0 : num;
    setHistory((prev) => [
      ...prev,
      {
        row,
        col,
        prevValue: prevVal,
        nextValue: nextVal,
        prevNotes: prevCellNotes,
        nextNotes: [],
      },
    ]);
    const nextGrid = grid.map((r, rIdx) =>
      rIdx === row ? r.map((cVal, cIdx) => (cIdx === col ? nextVal : cVal)) : [...r]
    );
    setGrid(nextGrid);
    if (nextVal !== 0) {
      setNotes((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      if (checkCompletion(nextGrid, solutionGrid)) {
        triggerWin(elapsedSeconds);
      }
    }
  }, [selectedCell, isPaused, isComplete, initialGrid, grid, notes, isPencilMode, solutionGrid, checkCompletion, triggerWin, elapsedSeconds]);
  const handleErase = useCallback(() => {
    if (!selectedCell || isPaused || isComplete) return;
    const { row, col } = selectedCell;
    if (initialGrid[row]?.[col] !== 0) return;
    const key = `${row}-${col}`;
    const prevVal = grid[row][col];
    const prevCellNotes = notes[key] ? [...notes[key]] : [];
    if (prevVal === 0 && prevCellNotes.length === 0) return;
    setHistory((prev) => [
      ...prev,
      {
        row,
        col,
        prevValue: prevVal,
        nextValue: 0,
        prevNotes: prevCellNotes,
        nextNotes: [],
      },
    ]);
    const nextGrid = grid.map((r, rIdx) =>
      rIdx === row ? r.map((cVal, cIdx) => (cIdx === col ? 0 : cVal)) : [...r]
    );
    setGrid(nextGrid);
    setNotes((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, [selectedCell, isPaused, isComplete, initialGrid, grid, notes]);
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isPaused || isComplete) return;
    const lastMove = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    const { row, col, prevValue, prevNotes } = lastMove;
    const key = `${row}-${col}`;
    setGrid((prev) =>
      prev.map((r, rIdx) =>
        rIdx === row ? r.map((cVal, cIdx) => (cIdx === col ? prevValue : cVal)) : [...r]
      )
    );
    setNotes((prev) => {
      const copy = { ...prev };
      if (prevNotes.length > 0) {
        copy[key] = prevNotes;
      } else {
        delete copy[key];
      }
      return copy;
    });
    setSelectedCell({ row, col });
  }, [history, isPaused, isComplete]);
  const handleHint = useCallback(() => {
    if (isPaused || isComplete) return;
    let targetR = -1;
    let targetC = -1;
    if (selectedCell && grid[selectedCell.row][selectedCell.col] === 0) {
      targetR = selectedCell.row;
      targetC = selectedCell.col;
    } else {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (grid[r][c] === 0) {
            targetR = r;
            targetC = c;
            break;
          }
        }
        if (targetR !== -1) break;
      }
    }
    if (targetR === -1 || targetC === -1) return;
    const correctVal = solutionGrid[targetR][targetC];
    const key = `${targetR}-${targetC}`;
    const nextGrid = grid.map((r, rIdx) =>
      rIdx === targetR ? r.map((cVal, cIdx) => (cIdx === targetC ? correctVal : cVal)) : [...r]
    );
    setGrid(nextGrid);
    setNotes((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setHintsUsed((prev) => prev + 1);
    setSelectedCell({ row: targetR, col: targetC });
    if (checkCompletion(nextGrid, solutionGrid)) {
      triggerWin(elapsedSeconds);
    }
  }, [isPaused, isComplete, selectedCell, grid, solutionGrid, checkCompletion, triggerWin, elapsedSeconds]);
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(Number(e.key));
        e.preventDefault();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
        e.preventDefault();
      } else if (e.key === 'n' || e.key === 'N') {
        setIsPencilMode((prev) => !prev);
        e.preventDefault();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        handleUndo();
        e.preventDefault();
      } else if (e.key === 'h' || e.key === 'H') {
        handleHint();
        e.preventDefault();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          const r = prev ? prev.row : 0;
          const c = prev ? prev.col : 0;
          if (e.key === 'ArrowUp') return { row: Math.max(0, r - 1), col: c };
          if (e.key === 'ArrowDown') return { row: Math.min(8, r + 1), col: c };
          if (e.key === 'ArrowLeft') return { row: r, col: Math.max(0, c - 1) };
          if (e.key === 'ArrowRight') return { row: r, col: Math.min(8, c + 1) };
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, handleNumberInput, handleErase, handleUndo, handleHint]);
  const activeValue = selectedCell ? grid[selectedCell.row]?.[selectedCell.col] : null;
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Sudoku</h1>
          <p className={styles.subtitle}>Fill each row, column, and 3×3 box with digits 1–9</p>
        </div>
        <div className={styles.timerBadge}>
          <FiClock aria-hidden="true" />
          <span>{formatTimer(elapsedSeconds)}</span>
        </div>
      </header>
      <div className={styles.topControls}>
        <div className={styles.difficultySelector} role="radiogroup" aria-label="Difficulty">
          {(['easy', 'medium', 'hard'] as SudokuDifficulty[]).map((diff) => (
            <button
              key={diff}
              type="button"
              className={`${styles.diffBtn} ${difficulty === diff ? styles.diffBtnActive : ''}`}
              onClick={() => startNewGame(diff)}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume game' : 'Pause game'}
          >
            {isPaused ? <FiPlay /> : <FiPause />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => startNewGame(difficulty)}
            title="Start new game"
          >
            <FiRefreshCw />
            <span>New</span>
          </button>
        </div>
      </div>
      <div className={styles.boardWrapper}>
        <div className={styles.grid}>
          {grid.map((row, r) =>
            row.map((val, c) => {
              const isGiven = initialGrid[r][c] !== 0;
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const isPeer =
                selectedCell &&
                (selectedCell.row === r ||
                  selectedCell.col === c ||
                  (Math.floor(selectedCell.row / 3) === Math.floor(r / 3) &&
                    Math.floor(selectedCell.col / 3) === Math.floor(c / 3)));
              const isSameNumber = activeValue && activeValue > 0 && val === activeValue;
              const hasError = val !== 0 && !isGiven && val !== solutionGrid[r][c];
              const cellNotes = notes[`${r}-${c}`] || [];
              const borderRightThick = c === 2 || c === 5;
              const borderBottomThick = r === 2 || r === 5;
              return (
                <div
                  key={`${r}-${c}`}
                  className={`
                    ${styles.cell}
                    ${isGiven ? styles.cellGiven : styles.cellUser}
                    ${borderRightThick ? styles.borderRightThick : ''}
                    ${borderBottomThick ? styles.borderBottomThick : ''}
                    ${isPeer ? styles.cellPeer : ''}
                    ${isSameNumber ? styles.cellSameNumber : ''}
                    ${isSelected ? styles.cellSelected : ''}
                    ${hasError ? styles.cellError : ''}
                  `}
                  onClick={() => handleCellClick(r, c)}
                >
                  {val !== 0 ? (
                    val
                  ) : cellNotes.length > 0 ? (
                    <div className={styles.notesGrid}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <div key={n} className={styles.noteItem}>
                          {cellNotes.includes(n) ? n : ''}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        {isPaused && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>Game Paused</h2>
              <p className={styles.modalText}>Take a breather. The timer is currently paused.</p>
              <button
                type="button"
                className={styles.primaryModalBtn}
                onClick={() => setIsPaused(false)}
              >
                Resume
              </button>
            </div>
          </div>
        )}
      </div>
      {isComplete && (
        <VictoryBanner
          gameTitle={`Sudoku (${difficulty.toUpperCase()})`}
          subtitle={`You solved the ${difficulty} puzzle in ${formatTimer(elapsedSeconds)}!`}
          stats={[
            { label: 'Time', value: formatTimer(elapsedSeconds) },
            { label: 'Difficulty', value: difficulty },
            { label: 'Hints Used', value: hintsUsed },
          ]}
          isPersonalBest={personalBest}
          onPlayAgain={() => startNewGame(difficulty)}
          playAgainLabel="Play Again"
          hubHref="/games"
        />
      )}
      <div className={styles.actionToolbar}>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleUndo}
          disabled={history.length === 0}
          title="Undo move (Ctrl+Z)"
        >
          <FiRotateCcw size={18} />
          <span>Undo</span>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleErase}
          title="Erase cell (Backspace)"
        >
          <FiTrash2 size={18} />
          <span>Erase</span>
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${isPencilMode ? styles.toolBtnActive : ''}`}
          onClick={() => setIsPencilMode(!isPencilMode)}
          title="Pencil / Note mode (N)"
        >
          <FiEdit2 size={18} />
          <span>Notes {isPencilMode ? 'ON' : 'OFF'}</span>
        </button>
        <button
          type="button"
          className={styles.toolBtn}
          onClick={handleHint}
          title="Get hint (H)"
        >
          <FiHelpCircle size={18} />
          <span>Hint</span>
        </button>
      </div>
      <div className={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const count = numberCounts[num] || 0;
          const remaining = Math.max(0, 9 - count);
          return (
            <button
              key={num}
              type="button"
              className={styles.numBtn}
              onClick={() => handleNumberInput(num)}
              disabled={remaining === 0 && !isPencilMode}
            >
              <span>{num}</span>
              <span className={styles.remainingBadge}>{remaining}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
