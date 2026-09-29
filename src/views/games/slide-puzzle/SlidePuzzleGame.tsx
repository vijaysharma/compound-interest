'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiRefreshCw, FiMousePointer, FiMove, FiLayers } from 'react-icons/fi';
import {
  canSlide,
  getShuffledBoard,
  isSolved,
  slideTiles,
  GRID_SIZE,
  TOTAL_TILES,
  type MovementControlMode,
  type SlideMove,
  type SlideResult,
} from './engine';
import { GameOverModal } from '../common/GameOverModal';
import { QuitButton, QuitModal } from '../common/QuitModal';
import { formatGameTime, recordGameScore } from '../common/leaderboardStorage';
import type { ScoreBreakdown } from '../common/scoring';
import styles from './SlidePuzzleGame.module.scss';
export const SlidePuzzleGame: React.FC = () => {
  const [tiles, setTiles] = useState<number[]>(() => getShuffledBoard());
  const [moves, setMoves] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [personalBest, setPersonalBest] = useState<boolean>(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [controlMode, setControlMode] = useState<MovementControlMode>(() => {
    if (typeof window === 'undefined') return 'tap';
    try {
      const saved = localStorage.getItem('slide_puzzle_control_mode') as MovementControlMode | null;
      if (saved && (saved === 'tap' || saved === 'swipe' || saved === 'hybrid')) {
        return saved;
      }
    } catch {
      // Storage unavailable in SSR or private mode
    }
    return 'tap';
  });
  const [movementLog, setMovementLog] = useState<SlideMove[]>([]);
  const tilesRef = useRef(tiles);
  useEffect(() => {
    tilesRef.current = tiles;
  }, [tiles]);
  const lastPointerTileRef = useRef<number | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const hasMovedInGestureRef = useRef<boolean>(false);
  const isSwipingRef = useRef<boolean>(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const handleModeChange = (mode: MovementControlMode) => {
    setControlMode(mode);
    try {
      localStorage.setItem('slide_puzzle_control_mode', mode);
    } catch {
      // Storage unavailable in SSR or private mode
    }
  };
  const resetGame = useCallback(() => {
    const next = getShuffledBoard();
    tilesRef.current = next;
    setTiles(next);
    setMoves(0);
    setElapsedSeconds(0);
    setIsWon(false);
    setIsStarted(false);
    setPersonalBest(false);
    setScoreBreakdown(null);
    setMovementLog([]);
    lastPointerTileRef.current = null;
    isPointerDownRef.current = false;
    hasMovedInGestureRef.current = false;
  }, []);
  useEffect(() => {
    if (!isStarted || isWon) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isWon]);
  const executeMove = useCallback((result: SlideResult, moveType: 'TAP' | 'SWIPE') => {
    if (!isStarted) setIsStarted(true);
    tilesRef.current = result.newTiles;
    setTiles(result.newTiles);
    setMoves((prev) => prev + 1);
    const now = Date.now();
    const newSlideMoves: SlideMove[] = result.moves.map((m) => ({
      ...m,
      moveType,
      timestamp: now,
    }));
    setMovementLog((prev) => [...prev, ...newSlideMoves]);
    if (isSolved(result.newTiles)) {
      setIsWon(true);
      setMoves((currentMoves) => {
        const finalMoves = currentMoves + 1;
        const res = recordGameScore({
          gameId: 'slide-puzzle',
          gameName: '15-Slide Puzzle',
          difficulty: '4x4',
          timeSeconds: elapsedSeconds + 1,
          moves: finalMoves,
          outcome: 'won',
        });
        setPersonalBest(res.isPersonalBest);
        setScoreBreakdown(res.scoreBreakdown);
        return finalMoves;
      });
    }
  }, [elapsedSeconds, isStarted]);
  const getTileIndexFromPoint = useCallback((clientX: number, clientY: number): number | null => {
    if (typeof document !== 'undefined') {
      const el = document.elementFromPoint(clientX, clientY);
      const tileEl = el?.closest('[data-idx]');
      if (tileEl) {
        const parsed = parseInt(tileEl.getAttribute('data-idx') || '-1', 10);
        if (parsed >= 0 && parsed < TOTAL_TILES) return parsed;
      }
    }
    const gridEl = boardRef.current?.querySelector(`.${styles.grid}`) as HTMLElement | null;
    const target = gridEl || boardRef.current;
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      return null;
    }
    const col = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((x / rect.width) * GRID_SIZE)));
    const row = Math.min(GRID_SIZE - 1, Math.max(0, Math.floor((y / rect.height) * GRID_SIZE)));
    return row * GRID_SIZE + col;
  }, []);
  const handleCellTransition = useCallback((currentIdx: number, isMoveGesture: boolean) => {
    if (isWon) return;
    if (controlMode === 'tap' && isMoveGesture) return;
    const currentTiles = tilesRef.current;
    const currentBlank = currentTiles.indexOf(0);
    if (currentBlank === -1) return;
    const prevIdx = lastPointerTileRef.current;
    lastPointerTileRef.current = currentIdx;
    if (prevIdx === null || prevIdx === currentIdx) {
      return;
    }
    // Moving FROM blank INTO adjacent number: swap tile into blank!
    if (prevIdx === currentBlank) {
      const blankRow = Math.floor(currentBlank / GRID_SIZE);
      const blankCol = currentBlank % GRID_SIZE;
      const targetRow = Math.floor(currentIdx / GRID_SIZE);
      const targetCol = currentIdx % GRID_SIZE;
      const isAdjacent =
        (Math.abs(blankRow - targetRow) === 1 && blankCol === targetCol) ||
        (Math.abs(blankCol - targetCol) === 1 && blankRow === targetRow);
      if (isAdjacent) {
        const result = slideTiles(currentTiles, currentIdx);
        if (result) {
          hasMovedInGestureRef.current = true;
          isSwipingRef.current = true;
          executeMove(result, 'SWIPE');
          lastPointerTileRef.current = currentIdx; // now currentIdx is the new blank space!
        }
      }
    }
  }, [controlMode, executeMove, isWon]);
  const handleTileClick = (idx: number) => {
    if (isWon) return;
    if (controlMode === 'swipe') return; // Taps disabled in swipe mode
    if (isSwipingRef.current) return; // Prevent click firing after swipe/slide
    const result = slideTiles(tilesRef.current, idx);
    if (!result) return;
    executeMove(result, 'TAP');
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isWon) return;
    isPointerDownRef.current = true;
    hasMovedInGestureRef.current = false;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore unsupported pointer capture
    }
    const idx = getTileIndexFromPoint(e.clientX, e.clientY);
    if (idx !== null) {
      lastPointerTileRef.current = idx;
    }
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isWon) return;
    const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';
    // On touch device, must be sliding with finger down
    if (isTouch && !isPointerDownRef.current) return;
    const idx = getTileIndexFromPoint(e.clientX, e.clientY);
    if (idx !== null) {
      handleCellTransition(idx, true);
    }
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    const wasMoved = hasMovedInGestureRef.current;
    isPointerDownRef.current = false;
    lastPointerTileRef.current = null;
    if (wasMoved) {
      isSwipingRef.current = true;
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 100);
    }
    hasMovedInGestureRef.current = false;
  };
  const handlePointerLeave = () => {
    lastPointerTileRef.current = null;
    isPointerDownRef.current = false;
  };
  const lastMove = movementLog[movementLog.length - 1];
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>15-Slide Puzzle</h1>
          <p className={styles.subtitle}>Slide tiles into ascending 1 to 15 sequence</p>
        </div>
        <QuitButton onClick={() => setShowQuitModal(true)} />
      </header>
      <div className={styles.hudBar}>
        <div className={styles.hudStat}>
          <span className={styles.hudLabel}>Moves</span>
          <span className={styles.hudValue}>{moves}</span>
        </div>
        <button type="button" className={styles.shuffleBtn} onClick={resetGame} aria-label="Shuffle board">
          <FiRefreshCw size={14} />
          <span>New Game</span>
        </button>
        <div className={styles.hudStat} style={{ textAlign: 'right' }}>
          <span className={styles.hudLabel}>Time</span>
          <span className={styles.hudValue}>{formatGameTime(elapsedSeconds)}</span>
        </div>
      </div>
      <div className={styles.controlModeSection}>
        <div className={styles.controlModeHeader}>
          <span className={styles.controlModeLabel}>Control Mode:</span>
          {lastMove && (
            <span className={styles.lastMoveBadge}>
              Last: Tile {lastMove.tileValue} {
                lastMove.directionRelativeToBlank === 'UP' ? '↑' :
                lastMove.directionRelativeToBlank === 'DOWN' ? '↓' :
                lastMove.directionRelativeToBlank === 'LEFT' ? '←' : '→'
              } ({lastMove.moveType})
            </span>
          )}
        </div>
        <div className={styles.segmentedControl} role="radiogroup" aria-label="Movement Control Mode">
          <button
            type="button"
            className={`${styles.segmentBtn} ${controlMode === 'tap' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleModeChange('tap')}
            role="radio"
            aria-checked={controlMode === 'tap'}
          >
            <FiMousePointer className={styles.btnIcon} />
            <span>Tap</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${controlMode === 'swipe' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleModeChange('swipe')}
            role="radio"
            aria-checked={controlMode === 'swipe'}
          >
            <FiMove className={styles.btnIcon} />
            <span>Slide / Hover</span>
          </button>
          <button
            type="button"
            className={`${styles.segmentBtn} ${controlMode === 'hybrid' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleModeChange('hybrid')}
            role="radio"
            aria-checked={controlMode === 'hybrid'}
          >
            <FiLayers className={styles.btnIcon} />
            <span>Hybrid</span>
          </button>
        </div>
      </div>
      {isWon && (
        <GameOverModal
          outcome="won"
          gameTitle="15-Slide Puzzle"
          subtitle="You solved the puzzle in numerical order!"
          scoreBreakdown={scoreBreakdown || undefined}
          timeSeconds={elapsedSeconds}
          stats={[
            { label: 'Moves', value: moves },
            { label: 'Time', value: formatGameTime(elapsedSeconds) },
            { label: 'Control', value: controlMode === 'tap' ? 'Tap' : controlMode === 'swipe' ? 'Slide / Hover' : 'Hybrid' },
            { label: 'Logged Slides', value: movementLog.length },
          ]}
          isPersonalBest={personalBest}
          onPlayAgain={resetGame}
          playAgainLabel="Play Again"
          hubHref="/games"
        />
      )}
      <QuitModal
        isOpen={showQuitModal}
        gameTitle="15-Slide Puzzle"
        onCancel={() => setShowQuitModal(false)}
        onConfirmQuit={() => setShowQuitModal(false)}
      />
      <div
        ref={boardRef}
        className={styles.boardWrapper}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <div className={styles.grid}>
          {tiles.map((val, idx) => {
            if (val === 0) {
              return (
                <div
                  key="blank"
                  data-idx={idx}
                  className={styles.tileEmpty}
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') {
                      handleCellTransition(idx, true);
                    }
                  }}
                  aria-hidden="true"
                />
              );
            }
            const isSlidable = !isWon && canSlide(tiles, idx);
            const isCorrect = val === idx + 1;
            let tileClass = styles.tile;
            if (isSlidable) tileClass += ` ${styles.tileSlidable}`;
            if (isCorrect) tileClass += ` ${styles.tileCorrect}`;
            return (
              <div
                key={val}
                data-idx={idx}
                className={tileClass}
                onClick={() => handleTileClick(idx)}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') {
                    handleCellTransition(idx, true);
                  }
                }}
                role="button"
                tabIndex={isSlidable ? 0 : -1}
                aria-label={`Tile ${val}`}
              >
                {val}
              </div>
            );
          })}
        </div>
      </div>
      <p className={styles.instructions}>
        {controlMode === 'tap' && 'Tap Mode: Tap any highlighted tile in the blank space\'s row or column to slide it.'}
        {controlMode === 'swipe' && 'Slide / Hover Mode: Hover on web or slide on device from the blank to any number to swap them continuously like a snake.'}
        {controlMode === 'hybrid' && 'Hybrid Mode: Tap tiles or hover/slide continuously from the blank space to speed-solve.'}
      </p>
    </div>
  );
};
