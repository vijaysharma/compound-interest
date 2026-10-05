'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FiFlag,
  FiZoomIn,
  FiZoomOut,
  FiSmile,
  FiFrown,
  FiAward,
  FiAlertCircle,
} from 'react-icons/fi';
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
import { GameShell } from '../common/GameShell';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { HowToPlayButton, HowToPlayModal } from '../common/HowToPlayModal';
import { recordGameScore, useGameSession } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import styles from './MinesweeperGame.module.scss';
const LONG_PRESS_MS = 350;
type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
export const MinesweeperGame: React.FC = () => {
  useGameSession('minesweeper');
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
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const handleZoomIn = () => setZoom((prev) => Math.min(2.0, Math.round((prev + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, Math.round((prev - 0.15) * 100) / 100));
  const handleZoomReset = () => setZoom(1.0);
  const cellSize = Math.round(30 * zoom);
  const cellFontSize = `${(1.15 * zoom).toFixed(2)}rem`;
  const FONT_SCALES = [1.0, 1.25, 1.5, 1.8];
  const [fontScaleIndex, setFontScaleIndex] = useState<number>(0);
  const mobileFontScale = FONT_SCALES[fontScaleIndex];
  const handleCycleFontScale = () => {
    setFontScaleIndex((prev) => (prev + 1) % FONT_SCALES.length);
  };
  const pointerStartRef = useRef<{ x: number; y: number; r: number; c: number; moved: boolean; at: number } | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);
  const lastLongPressTimestampRef = useRef<number>(0);
  const resetGame = useCallback((diff: MinesweeperDifficulty, mobileOverride?: boolean) => {
    const activeMob = mobileOverride !== undefined ? mobileOverride : (typeof window !== 'undefined' && window.innerWidth < 768);
    const nextConfig = getPreset(diff, activeMob);
    setBoard(createEmptyBoard(nextConfig.rows, nextConfig.cols));
    setGameStatus('idle');
    setElapsedSeconds(0);
    setIsFaceSurprised(false);
    setScoreBreakdown(null);
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
  const handleWin = useCallback(
    (currentBoard: Cell[][]) => {
      currentBoard.forEach((row) => {
        row.forEach((cell) => {
          if (cell.isMine) cell.state = 'flagged';
        });
      });
      setBoard(currentBoard);
      const res = recordGameScore({
        gameId: 'minesweeper',
        gameName: 'Minesweeper',
        difficulty,
        timeSeconds: elapsedSeconds,
        accuracy: '100%',
        outcome: 'won',
      });
      setPersonalBest(res.isPersonalBest);
      setScoreBreakdown(res.scoreBreakdown);
      setGameStatus('won');
    },
    [difficulty, elapsedSeconds]
  );
  const handleLose = useCallback(
    (currentBoard: Cell[][]) => {
      setBoard(currentBoard);
      const res = recordGameScore({
        gameId: 'minesweeper',
        gameName: 'Minesweeper',
        difficulty,
        timeSeconds: elapsedSeconds,
        outcome: 'lost',
      });
      setScoreBreakdown(res.scoreBreakdown);
      setGameStatus('lost');
    },
    [difficulty, elapsedSeconds]
  );
  const revealCell = useCallback(
    (r: number, c: number) => {
      if (gameStatus === 'won' || gameStatus === 'lost') return;
      if (board[r]?.[c]?.state !== 'hidden') return;
      const currentBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      // First click safety: populate mines now (only on a real dig, never on a flagged cell)
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
        handleLose(currentBoard);
        return;
      }
      if (target.neighborMines === 0) {
        floodFillReveal(currentBoard, r, c, config.rows, config.cols);
      } else {
        target.state = 'revealed';
      }
      if (checkWinCondition(currentBoard, config.rows, config.cols, config.mines)) {
        handleWin(currentBoard);
        return;
      }
      setBoard(currentBoard);
    },
    [board, gameStatus, config, handleWin, handleLose]
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
          handleLose(currentBoard);
          return;
        }
        if (checkWinCondition(currentBoard, config.rows, config.cols, config.mines)) {
          handleWin(currentBoard);
          return;
        }
        setBoard(currentBoard);
      }
    },
    [board, gameStatus, config, handleWin, handleLose]
  );
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, r: number, c: number) => {
      if (gameStatus === 'won' || gameStatus === 'lost') return;
      if (e.button !== 0) return;
      pointerStartRef.current = { x: e.clientX, y: e.clientY, r, c, moved: false, at: Date.now() };
      isLongPressRef.current = false;
      setIsFaceSurprised(true);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        lastLongPressTimestampRef.current = Date.now();
        longPressTimerRef.current = null;
        toggleFlag(r, c);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(35);
          } catch {
            // ignore vibration error
          }
        }
      }, LONG_PRESS_MS);
    },
    [gameStatus, toggleFlag]
  );
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerStartRef.current || pointerStartRef.current.moved) return;
    const dist = Math.hypot(e.clientX - pointerStartRef.current.x, e.clientY - pointerStartRef.current.y);
    if (dist > 10) {
      pointerStartRef.current.moved = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsFaceSurprised(false);
    }
  }, []);
  const handlePointerUp = useCallback(
    (e: React.PointerEvent, r: number, c: number) => {
      setIsFaceSurprised(false);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (isLongPressRef.current) {
        isLongPressRef.current = false;
        pointerStartRef.current = null;
        return;
      }
      // Browsers run input events ahead of timers, so on a busy phone the release can arrive
      // before the long-press timer fires; judge the hold by its actual duration as well.
      const heldLong = pointerStartRef.current && Date.now() - pointerStartRef.current.at >= LONG_PRESS_MS;
      if (heldLong && !pointerStartRef.current?.moved) {
        lastLongPressTimestampRef.current = Date.now();
        toggleFlag(r, c);
      } else if (pointerStartRef.current && !pointerStartRef.current.moved) {
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
      }
      pointerStartRef.current = null;
    },
    [board, gameStatus, handleChord, isFlagMode, revealCell, toggleFlag]
  );
  const handlePointerCancel = useCallback(() => {
    setIsFaceSurprised(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isLongPressRef.current) {
      lastLongPressTimestampRef.current = Date.now();
      isLongPressRef.current = false;
    }
    pointerStartRef.current = null;
  }, []);
  const handleContextMenu = useCallback(
    (e: React.MouseEvent, r: number, c: number) => {
      e.preventDefault();
      e.stopPropagation();
      // If long press already executed via timer, suppress duplicate event from Android contextmenu
      if (Date.now() - lastLongPressTimestampRef.current < 800) {
        return;
      }
      // If long press timer is still active, Android contextmenu fired before the 350ms timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        isLongPressRef.current = true;
        lastLongPressTimestampRef.current = Date.now();
        toggleFlag(r, c);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(35);
          } catch {
            // ignore vibration error
          }
        }
        return;
      }
      // Standard desktop right click
      toggleFlag(r, c);
    },
    [toggleFlag]
  );
  const flaggedCount = getFlaggedCount(board);
  const minesLeft = Math.max(0, config.mines - flaggedCount);
  const faceIcon =
    gameStatus === 'lost' ? (
      <FiFrown size={20} />
    ) : gameStatus === 'won' ? (
      <FiAward size={20} />
    ) : isFaceSurprised ? (
      <FiAlertCircle size={20} />
    ) : (
      <FiSmile size={20} />
    );
  return (
    <GameShell className={styles.container}>
      <GameShell.Header
        title="Minesweeper"
        subtitle="Uncover safe tiles without detonating hidden mines"
        actions={
          <div className={styles.headerActions}>
            <HowToPlayButton onClick={() => setShowHowToPlay(true)} />
            <QuitButton onClick={() => setShowQuitModal(true)} />
          </div>
        }
      />
      <div className={styles.controlsRow}>
        <div className={styles.difficultySelector} role="radiogroup" aria-label="Difficulty">
          {(['easy', 'medium', 'hard'] as MinesweeperDifficulty[]).map((diff) => (
            <button
              key={diff}
              type="button"
              role="radio"
              aria-checked={difficulty === diff}
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
      <div className={styles.boardCard} onContextMenu={(e) => e.preventDefault()}>
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
            {faceIcon}
          </button>
          <div className={styles.counterDisplay} title="Elapsed time">
            {elapsedSeconds.toString().padStart(3, '0')}
          </div>
        </div>
        <div className={styles.gridScrollWrapper} onContextMenu={(e) => e.preventDefault()}>
          <div
            ref={gridContainerRef}
            className={styles.grid}
            role="group"
            aria-label={`Minefield, ${config.rows} rows by ${config.cols} columns`}
            style={
              isMobile
                ? ({
                    gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
                    width: '100%',
                    '--cell-font-scale': mobileFontScale,
                  } as React.CSSProperties)
                : ({
                    gridTemplateColumns: `repeat(${config.cols}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${config.rows}, ${cellSize}px)`,
                    width: 'max-content',
                    '--cell-size': `${cellSize}px`,
                    '--cell-font-size': cellFontSize,
                    '--cell-font-scale': 1.0,
                  } as React.CSSProperties)
            }
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                let content: React.ReactNode = null;
                let cellClass = styles.cellHidden;
                if (cell.state === 'revealed') {
                  if (cell.isMine) {
                    content = <FiAlertCircle size={16} aria-label="Mine" />;
                    cellClass = cell.exploded ? styles.cellMineExploded : styles.cellRevealed;
                  } else {
                    cellClass = styles.cellRevealed;
                    if (cell.neighborMines > 0) {
                      content = cell.neighborMines;
                    }
                  }
                } else if (cell.state === 'flagged') {
                  content = <FiFlag size={14} aria-label="Flagged" />;
                }
                const numberClass = cell.neighborMines > 0 && cell.state === 'revealed' && !cell.isMine ? styles[`n${cell.neighborMines}`] : '';
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.cell} ${cellClass} ${numberClass}`}
                    role="button"
                    aria-label={`Row ${r + 1}, column ${c + 1}: ${
                      cell.state === 'flagged'
                        ? 'flagged'
                        : cell.state === 'hidden'
                          ? 'hidden'
                          : cell.isMine
                            ? 'mine'
                            : cell.neighborMines > 0
                              ? `${cell.neighborMines} adjacent mines`
                              : 'clear'
                    }`}
                    onPointerDown={(e) => handlePointerDown(e, r, c)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(e) => handlePointerUp(e, r, c)}
                    onPointerCancel={handlePointerCancel}
                    onContextMenu={(e) => handleContextMenu(e, r, c)}
                    onClick={(e) => e.preventDefault()}
                  >
                    {content !== null && <span className={styles.cellContent}>{content}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      {(gameStatus === 'won' || gameStatus === 'lost') && (
        <GameOverModal
          outcome={gameStatus}
          gameTitle={`Minesweeper (${activePresets[difficulty].label})`}
          subtitle={
            gameStatus === 'won'
              ? `You swept all ${config.mines} hidden mines!`
              : 'You detonated a mine! Review your board and try again.'
          }
          scoreBreakdown={scoreBreakdown || undefined}
          timeSeconds={elapsedSeconds}
          stats={[
            { label: 'Time', value: `${elapsedSeconds}s` },
            { label: 'Difficulty', value: activePresets[difficulty].label },
            { label: 'Mines', value: config.mines },
          ]}
          isPersonalBest={personalBest}
          onPlayAgain={() => resetGame(difficulty)}
          playAgainLabel="Play Again"
          hubHref="/games"
        />
      )}
      <QuitModal
        isOpen={showQuitModal}
        gameTitle="Minesweeper"
        onCancel={() => setShowQuitModal(false)}
        onConfirmQuit={() => setShowQuitModal(false)}
      />
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
        gameTitle="Minesweeper"
        objective="Uncover all safe squares without detonating any of the hidden mines on the field."
        rules={[
          <><strong>Uncovering Cells:</strong> Clicking or tapping an unrevealed square digs it up.</>,
          <><strong>Number Clues:</strong> Numbers (1–8) reveal how many mines are located directly in the 8 neighboring cells around that square.</>,
          <><strong>Zero Clue / Blank:</strong> Opening a square with 0 adjacent mines automatically expands and opens all connected safe squares.</>,
          <><strong>Flags:</strong> Place flags on suspected mine locations to avoid accidentally detonating them.</>,
          <><strong>Chording:</strong> Clicking/tapping an already revealed number when all its surrounding flags are placed will instantly reveal all other adjacent cells.</>,
        ]}
        controls={{
          desktop: 'Left-click to reveal/dig. Right-click to place or remove a flag. Click a revealed number to chord.',
          mobile: 'Tap to dig (or flag if Flag Mode is ON). Long-press to toggle a flag with haptic vibration.',
          shortcuts: 'Use the reset face button to quickly restart or reset the current board.',
        }}
        tips={[
          'Your very first click is guaranteed 100% safe—mines are only placed after you take your first action.',
          'If a cell shows "1" and touches only one unrevealed square, that square is guaranteed to be a mine.',
          'If an uncovered number equals the number of flags already placed around it, chord that number to sweep adjacent cells rapidly.',
        ]}
      />
      <div className={styles.mobileControls}>
        <button
          type="button"
          className={`${styles.modeToggleBtn} ${isFlagMode ? styles.modeToggleActive : ''}`}
          onClick={() => setIsFlagMode(!isFlagMode)}
          aria-pressed={isFlagMode}
        >
          <FiFlag />
          <span>{isFlagMode ? 'Flagging Mode: ON' : 'Tap to Dig (Switch to Flag)'}</span>
        </button>
        {isMobile && (
          <button
            type="button"
            className={styles.mobileFontScalerBtn}
            onClick={handleCycleFontScale}
            title="Scale cell font size"
            aria-label={`Scale cell font size: currently ${Math.round(mobileFontScale * 100)}%`}
          >
            <span className={styles.fontScalerIcon}>A+</span>
            <span>{Math.round(mobileFontScale * 100)}%</span>
          </button>
        )}
      </div>
      <p className={styles.instructions}>
        Tap to dig. Long-press or toggle Flag mode to mark mines. Tap revealed numbers to chord.
      </p>
    </GameShell>
  );
};
