'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiFlag } from 'react-icons/fi';
import {
  checkWinCondition,
  createEmptyBoard,
  floodFillReveal,
  getFlaggedCount,
  getNeighbors,
  populateMines,
} from './engine';
import { PRESETS } from './types';
import type { Cell, CellState, MinesweeperDifficulty } from './types';
import styles from './MinesweeperGame.module.scss';
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
interface MagnifierState {
  visible: boolean;
  x: number;
  y: number;
  row: number;
  col: number;
  cell: Cell | null;
}
export const MinesweeperGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<MinesweeperDifficulty>('easy');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const config = PRESETS[difficulty];
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(config.rows, config.cols));
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFlagMode, setIsFlagMode] = useState<boolean>(false);
  const [isFaceSurprised, setIsFaceSurprised] = useState<boolean>(false);
  const [magnifier, setMagnifier] = useState<MagnifierState>({
    visible: false,
    x: 0,
    y: 0,
    row: 0,
    col: 0,
    cell: null,
  });
  const touchActiveRef = useRef<boolean>(false);
  const lastTouchTargetRef = useRef<{ row: number; col: number } | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => Math.min(999, prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus]);
  const resetGame = useCallback((diff: MinesweeperDifficulty) => {
    const nextConfig = PRESETS[diff];
    setBoard(createEmptyBoard(nextConfig.rows, nextConfig.cols));
    setGameStatus('idle');
    setElapsedSeconds(0);
    setIsFaceSurprised(false);
    setMagnifier((prev) => ({ ...prev, visible: false }));
  }, []);
  const handleDifficultyChange = (nextDiff: MinesweeperDifficulty) => {
    setDifficulty(nextDiff);
    resetGame(nextDiff);
  };
  const toggleFlag = useCallback((r: number, c: number) => {
    setBoard((prev) => {
      const cell = prev[r]?.[c];
      if (!cell || cell.state === 'revealed') return prev;
      let nextState: CellState = 'flagged';
      if (cell.state === 'flagged') nextState = 'question';
      else if (cell.state === 'question') nextState = 'hidden';
      return prev.map((row, rIdx) =>
        rIdx === r ? row.map((cellItem, cIdx) => (cIdx === c ? { ...cellItem, state: nextState } : cellItem)) : [...row]
      );
    });
  }, []);
  const revealCell = useCallback(
    (r: number, c: number) => {
      if (gameStatus === 'won' || gameStatus === 'lost') return;
      const currentBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      // First click safety: populate mines now
      if (gameStatus === 'idle') {
        populateMines(currentBoard, config.rows, config.cols, config.mines, r, c);
        setGameStatus('playing');
      }
      const target = currentBoard[r][c];
      if (target.state === 'flagged' || target.state === 'revealed') return;
      if (target.isMine) {
        // Mine hit: Game over
        target.exploded = true;
        currentBoard.forEach((row) => {
          row.forEach((cell) => {
            if (cell.isMine) cell.state = 'revealed';
          });
        });
        setBoard(currentBoard);
        setGameStatus('lost');
        return;
      }
      if (target.neighborMines === 0) {
        floodFillReveal(currentBoard, r, c, config.rows, config.cols);
      } else {
        target.state = 'revealed';
      }
      if (checkWinCondition(currentBoard, config.rows, config.cols, config.mines)) {
        currentBoard.forEach((row) => {
          row.forEach((cell) => {
            if (cell.isMine) cell.state = 'flagged';
          });
        });
        setBoard(currentBoard);
        setGameStatus('won');
        return;
      }
      setBoard(currentBoard);
    },
    [board, gameStatus, config]
  );
  // Chording: clicking a revealed numbered cell
  const handleChord = useCallback(
    (r: number, c: number) => {
      if (gameStatus !== 'playing') return;
      const cell = board[r][c];
      if (cell.state !== 'revealed' || cell.neighborMines === 0) return;
      const neighbors = getNeighbors(r, c, config.rows, config.cols);
      const flaggedNeighbors = neighbors.filter(([nr, nc]) => board[nr][nc].state === 'flagged').length;
      if (flaggedNeighbors === cell.neighborMines) {
        const currentBoard = board.map((row) => row.map((item) => ({ ...item })));
        let hitMine = false;
        for (const [nr, nc] of neighbors) {
          const nCell = currentBoard[nr][nc];
          if (nCell.state === 'hidden' || nCell.state === 'question') {
            if (nCell.isMine) {
              hitMine = true;
              nCell.exploded = true;
            } else if (nCell.neighborMines === 0) {
              floodFillReveal(currentBoard, nr, nc, config.rows, config.cols);
            } else {
              nCell.state = 'revealed';
            }
          }
        }
        if (hitMine) {
          currentBoard.forEach((row) => {
            row.forEach((cellItem) => {
              if (cellItem.isMine) cellItem.state = 'revealed';
            });
          });
          setBoard(currentBoard);
          setGameStatus('lost');
          return;
        }
        if (checkWinCondition(currentBoard, config.rows, config.cols, config.mines)) {
          currentBoard.forEach((row) => {
            row.forEach((cellItem) => {
              if (cellItem.isMine) cellItem.state = 'flagged';
            });
          });
          setBoard(currentBoard);
          setGameStatus('won');
          return;
        }
        setBoard(currentBoard);
      }
    },
    [board, gameStatus, config]
  );
  const findCellFromPoint = useCallback(
    (clientX: number, clientY: number): { row: number; col: number; cell: Cell } | null => {
      const el = document.elementFromPoint(clientX, clientY);
      const cellEl = el?.closest('[data-cell-row]');
      if (!cellEl) return null;
      const r = Number(cellEl.getAttribute('data-cell-row'));
      const c = Number(cellEl.getAttribute('data-cell-col'));
      if (Number.isFinite(r) && Number.isFinite(c) && board[r]?.[c]) {
        return { row: r, col: c, cell: board[r][c] };
      }
      return null;
    },
    [board]
  );
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    touchActiveRef.current = true;
    const touch = e.touches[0];
    const target = findCellFromPoint(touch.clientX, touch.clientY);
    if (target) {
      lastTouchTargetRef.current = { row: target.row, col: target.col };
      setMagnifier({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        row: target.row,
        col: target.col,
        cell: target.cell,
      });
      setIsFaceSurprised(true);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchActiveRef.current || gameStatus === 'won' || gameStatus === 'lost') return;
    const touch = e.touches[0];
    const target = findCellFromPoint(touch.clientX, touch.clientY);
    if (target) {
      lastTouchTargetRef.current = { row: target.row, col: target.col };
      setMagnifier({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        row: target.row,
        col: target.col,
        cell: target.cell,
      });
    } else {
      setMagnifier((prev) => ({ ...prev, x: touch.clientX, y: touch.clientY }));
    }
  };
  const handleTouchEnd = () => {
    setIsFaceSurprised(false);
    setMagnifier((prev) => ({ ...prev, visible: false }));
    if (lastTouchTargetRef.current && (gameStatus === 'idle' || gameStatus === 'playing')) {
      const { row, col } = lastTouchTargetRef.current;
      const cell = board[row]?.[col];
      if (cell) {
        if (cell.state === 'revealed') {
          handleChord(row, col);
        } else if (isFlagMode) {
          toggleFlag(row, col);
        } else {
          revealCell(row, col);
        }
      }
    }
    lastTouchTargetRef.current = null;
    setTimeout(() => {
      touchActiveRef.current = false;
    }, 150);
  };
  const handleTouchCancel = () => {
    setIsFaceSurprised(false);
    setMagnifier((prev) => ({ ...prev, visible: false }));
    lastTouchTargetRef.current = null;
    setTimeout(() => {
      touchActiveRef.current = false;
    }, 150);
  };
  const handleCellClick = (r: number, c: number) => {
    if (touchActiveRef.current) return;
    const cell = board[r][c];
    if (cell.state === 'revealed') {
      handleChord(r, c);
      return;
    }
    if (isFlagMode) {
      toggleFlag(r, c);
    } else {
      revealCell(r, c);
    }
  };
  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    toggleFlag(r, c);
  };
  const flaggedCount = getFlaggedCount(board);
  const minesLeft = Math.max(0, config.mines - flaggedCount);
  const faceEmoji =
    gameStatus === 'lost'
      ? '😵'
      : gameStatus === 'won'
        ? '😎'
        : isFaceSurprised
          ? '😮'
          : '🙂';
  const magnifierLeft = typeof window !== 'undefined'
    ? Math.max(42, Math.min(magnifier.x, window.innerWidth - 42))
    : magnifier.x;
  const magnifierTop = Math.max(80, magnifier.y - 75);
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Minesweeper</h1>
          <p className={styles.subtitle}>Uncover safe tiles without detonating hidden mines</p>
        </div>
      </header>
      <div className={styles.difficultySelector} role="radiogroup" aria-label="Difficulty">
        {(['easy', 'medium', 'hard'] as MinesweeperDifficulty[]).map((diff) => (
          <button
            key={diff}
            type="button"
            className={`${styles.diffBtn} ${difficulty === diff ? styles.diffBtnActive : ''}`}
            onClick={() => handleDifficultyChange(diff)}
          >
            {PRESETS[diff].label}
          </button>
        ))}
      </div>
      <div className={styles.boardCard}>
        <div className={styles.topBar}>
          <div className={styles.counterDisplay} title="Mines remaining">
            {minesLeft.toString().padStart(3, '0')}
          </div>
          <button
            type="button"
            className={styles.faceBtn}
            onClick={() => resetGame(difficulty)}
            title="Reset game"
            aria-label="Reset game"
          >
            {faceEmoji}
          </button>
          <div className={styles.counterDisplay} title="Elapsed time">
            {elapsedSeconds.toString().padStart(3, '0')}
          </div>
        </div>
        <div className={styles.gridScrollWrapper}>
          <div
            ref={gridContainerRef}
            className={styles.grid}
            style={{
              gridTemplateColumns: `repeat(${config.cols}, ${isMobile ? '28px' : '30px'})`,
              gridTemplateRows: `repeat(${config.rows}, ${isMobile ? '28px' : '30px'})`,
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                let content: React.ReactNode = null;
                let cellClass = styles.cellHidden;
                if (cell.state === 'revealed') {
                  if (cell.isMine) {
                    content = '💣';
                    cellClass = cell.exploded ? styles.cellMineExploded : styles.cellRevealed;
                  } else {
                    cellClass = styles.cellRevealed;
                    if (cell.neighborMines > 0) {
                      content = cell.neighborMines;
                    }
                  }
                } else if (cell.state === 'flagged') {
                  content = '🚩';
                } else if (cell.state === 'question') {
                  content = '?';
                }
                const numberClass = cell.neighborMines > 0 && cell.state === 'revealed' && !cell.isMine ? styles[`n${cell.neighborMines}`] : '';
                const isTargeted = magnifier.visible && magnifier.row === r && magnifier.col === c;
                return (
                  <div
                    key={`${r}-${c}`}
                    data-cell-row={r}
                    data-cell-col={c}
                    className={`${styles.cell} ${cellClass} ${numberClass} ${isTargeted ? styles.cellTargeted : ''}`}
                    onClick={() => handleCellClick(r, c)}
                    onContextMenu={(e) => handleContextMenu(e, r, c)}
                  >
                    {content}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      <div className={styles.mobileControls}>
        <button
          type="button"
          className={`${styles.modeToggleBtn} ${isFlagMode ? styles.modeToggleActive : ''}`}
          onClick={() => setIsFlagMode(!isFlagMode)}
        >
          <FiFlag />
          <span>{isFlagMode ? 'Flagging Mode: ON' : 'Tap to Dig (Switch to Flag)'}</span>
        </button>
      </div>
      <p className={styles.instructions}>
        Touch and hold to aim with the floating magnifier loupe; release to act. Right-click or toggle Flag mode to mark mines.
      </p>
      {/* Touch Magnifier Loupe Callout */}
      {magnifier.visible && magnifier.cell && (
        <div
          className={styles.magnifierContainer}
          style={{
            left: magnifierLeft,
            top: magnifierTop,
          }}
        >
          <div className={styles.magnifierBubble}>
            <div
              className={`
                ${styles.magnifierTile}
                ${magnifier.cell.state === 'hidden' ? styles.cellHidden : styles.cellRevealed}
                ${magnifier.cell.neighborMines > 0 && magnifier.cell.state === 'revealed' ? styles[`n${magnifier.cell.neighborMines}`] : ''}
              `}
            >
              {magnifier.cell.state === 'revealed'
                ? magnifier.cell.isMine
                  ? '💣'
                  : magnifier.cell.neighborMines > 0
                    ? magnifier.cell.neighborMines
                    : ''
                : magnifier.cell.state === 'flagged'
                  ? '🚩'
                  : magnifier.cell.state === 'question'
                    ? '?'
                    : isFlagMode
                      ? '🚩'
                      : '⛏️'}
            </div>
            <span className={styles.magnifierLabel}>
              {isFlagMode ? 'FLAG' : 'DIG'} ({magnifier.row + 1},{magnifier.col + 1})
            </span>
          </div>
          <div className={styles.magnifierArrow} />
        </div>
      )}
    </div>
  );
};
