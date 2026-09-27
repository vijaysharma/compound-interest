'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiFlag, FiZoomIn, FiZoomOut } from 'react-icons/fi';
import {
  checkWinCondition,
  createEmptyBoard,
  floodFillReveal,
  getFlaggedCount,
  getNeighbors,
  populateMines,
} from './engine';
import { getPreset, MOBILE_PRESETS, WEB_PRESETS } from './types';
import type { Cell, CellState, MinesweeperDifficulty } from './types';
import styles from './MinesweeperGame.module.scss';
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
export const MinesweeperGame: React.FC = () => {
  const [difficulty, setDifficulty] = useState<MinesweeperDifficulty>('easy');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const activePresets = isMobile ? MOBILE_PRESETS : WEB_PRESETS;
  const config = activePresets[difficulty];
  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(config.rows, config.cols));
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFlagMode, setIsFlagMode] = useState<boolean>(false);
  const [isFaceSurprised, setIsFaceSurprised] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const handleZoomIn = () => setZoom((prev) => Math.min(2.0, Math.round((prev + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, Math.round((prev - 0.15) * 100) / 100));
  const handleZoomReset = () => setZoom(1.0);
  const cellSize = Math.round(30 * zoom);
  const cellFontSize = `${(1.15 * zoom).toFixed(2)}rem`;
  const touchActiveRef = useRef<boolean>(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const resetGame = useCallback((diff: MinesweeperDifficulty, mobileOverride?: boolean) => {
    const activeMob = mobileOverride !== undefined ? mobileOverride : (typeof window !== 'undefined' && window.innerWidth < 768);
    const nextConfig = getPreset(diff, activeMob);
    setBoard(createEmptyBoard(nextConfig.rows, nextConfig.cols));
    setGameStatus('idle');
    setElapsedSeconds(0);
    setIsFaceSurprised(false);
  }, []);
  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < 768;
      setIsMobile((prev) => {
        if (prev !== nextIsMobile) {
          resetGame(difficulty, nextIsMobile);
          return nextIsMobile;
        }
        return prev;
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [difficulty, resetGame]);
  // Timer effect
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => Math.min(999, prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus]);
  const handleDifficultyChange = (nextDiff: MinesweeperDifficulty) => {
    setDifficulty(nextDiff);
    resetGame(nextDiff);
  };
  const toggleFlag = useCallback((r: number, c: number) => {
    setBoard((prev) => {
      const cell = prev[r]?.[c];
      if (!cell || cell.state === 'revealed') return prev;
      const nextState: CellState = cell.state === 'flagged' ? 'hidden' : 'flagged';
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
          if (nCell.state === 'hidden') {
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
  const handleTouchStart = (r: number, c: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;
    touchActiveRef.current = true;
    isLongPressRef.current = false;
    setIsFaceSurprised(true);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      toggleFlag(r, c);
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(35);
        } catch {
          // ignore
        }
      }
    }, 400);
  };
  const handleTouchEnd = (r: number, c: number) => {
    setIsFaceSurprised(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      setTimeout(() => {
        touchActiveRef.current = false;
      }, 150);
      return;
    }
    if (gameStatus === 'idle' || gameStatus === 'playing') {
      const cell = board[r]?.[c];
      if (cell) {
        if (cell.state === 'revealed') {
          handleChord(r, c);
        } else if (isFlagMode) {
          toggleFlag(r, c);
        } else {
          revealCell(r, c);
        }
      }
    }
    setTimeout(() => {
      touchActiveRef.current = false;
    }, 150);
  };
  const handleTouchCancel = () => {
    setIsFaceSurprised(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isLongPressRef.current = false;
    setTimeout(() => {
      touchActiveRef.current = false;
    }, 150);
  };
  const handleCellClick = (r: number, c: number) => {
    if (touchActiveRef.current) return;
    const cell = board[r]?.[c];
    if (!cell) return;
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
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Minesweeper</h1>
          <p className={styles.subtitle}>Uncover safe tiles without detonating hidden mines</p>
        </div>
      </header>
      <div className={styles.controlsRow}>
        <div className={styles.difficultySelector} role="radiogroup" aria-label="Difficulty">
          {(['easy', 'medium', 'hard'] as MinesweeperDifficulty[]).map((diff) => (
            <button
              key={diff}
              type="button"
              className={`${styles.diffBtn} ${difficulty === diff ? styles.diffBtnActive : ''}`}
              onClick={() => handleDifficultyChange(diff)}
            >
              {activePresets[diff].label}
            </button>
          ))}
        </div>
        {!isMobile && (
          <div className={styles.webZoomControls} aria-label="Zoom controls">
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={handleZoomOut}
              disabled={zoom <= 0.6}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <FiZoomOut size={15} />
            </button>
            <button
              type="button"
              className={styles.zoomResetBtn}
              onClick={handleZoomReset}
              title="Reset zoom to 100%"
              aria-label="Reset zoom"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              className={styles.zoomBtn}
              onClick={handleZoomIn}
              disabled={zoom >= 2.0}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <FiZoomIn size={15} />
            </button>
          </div>
        )}
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
            style={
              isMobile
                ? {
                    gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
                    width: '100%',
                  }
                : ({
                    gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
                    width: 'max-content',
                    '--cell-size': `${cellSize}px`,
                    '--cell-font-size': cellFontSize,
                  } as React.CSSProperties)
            }
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
                }
                const numberClass = cell.neighborMines > 0 && cell.state === 'revealed' && !cell.isMine ? styles[`n${cell.neighborMines}`] : '';
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.cell} ${cellClass} ${numberClass}`}
                    onTouchStart={() => handleTouchStart(r, c)}
                    onTouchEnd={() => handleTouchEnd(r, c)}
                    onTouchCancel={handleTouchCancel}
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
        Tap to dig. Long-press or toggle Flag mode to mark mines. Tap revealed numbers to chord.
      </p>
    </div>
  );
};
