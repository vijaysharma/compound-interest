'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiRefreshCw, FiMousePointer, FiMove, FiLayers } from 'react-icons/fi';
import {
  canSlide,
  getShuffledBoard,
  isSolved,
  slideInDirection,
  slideTileInDirection,
  slideTiles,
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
  const pointerStartRef = useRef<{ x: number; y: number; tileIdx: number | null } | null>(null);
  const isSwipingRef = useRef<boolean>(false);
  const handleModeChange = (mode: MovementControlMode) => {
    setControlMode(mode);
    try {
      localStorage.setItem('slide_puzzle_control_mode', mode);
    } catch {
      // Storage unavailable in SSR or private mode
    }
  };
  const resetGame = useCallback(() => {
    setTiles(getShuffledBoard());
    setMoves(0);
    setElapsedSeconds(0);
    setIsWon(false);
    setIsStarted(false);
    setPersonalBest(false);
    setScoreBreakdown(null);
    setMovementLog([]);
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
    const nextMoves = moves + 1;
    setTiles(result.newTiles);
    setMoves(nextMoves);
    const now = Date.now();
    const newSlideMoves: SlideMove[] = result.moves.map((m) => ({
      ...m,
      moveType,
      timestamp: now,
    }));
    setMovementLog((prev) => [...prev, ...newSlideMoves]);
    if (isSolved(result.newTiles)) {
      setIsWon(true);
      const res = recordGameScore({
        gameId: 'slide-puzzle',
        gameName: '15-Slide Puzzle',
        difficulty: '4x4',
        timeSeconds: elapsedSeconds + 1,
        moves: nextMoves,
        outcome: 'won',
      });
      setPersonalBest(res.isPersonalBest);
      setScoreBreakdown(res.scoreBreakdown);
    }
  }, [elapsedSeconds, isStarted, moves]);
  const handleTileClick = (idx: number) => {
    if (isWon) return;
    if (controlMode === 'swipe') return; // Taps disabled in swipe mode
    if (isSwipingRef.current) return; // Prevent double execution in hybrid mode
    const result = slideTiles(tiles, idx);
    if (!result) return;
    executeMove(result, 'TAP');
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, tileIdx: null };
  };
  const handleTilePointerDown = (e: React.PointerEvent, idx: number) => {
    e.stopPropagation();
    pointerStartRef.current = { x: e.clientX, y: e.clientY, tileIdx: idx };
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || isWon) return;
    const { x: startX, y: startY, tileIdx } = pointerStartRef.current;
    pointerStartRef.current = null;
    if (controlMode === 'tap') return; // Swipes disabled in tap mode
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const minSwipe = 24;
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;
    isSwipingRef.current = true;
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 150);
    const dir: 'up' | 'down' | 'left' | 'right' =
      Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
    const result = tileIdx !== null
      ? slideTileInDirection(tiles, tileIdx, dir)
      : slideInDirection(tiles, dir);
    if (!result) return;
    executeMove(result, 'SWIPE');
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
            <span>Swipe</span>
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
            { label: 'Control', value: controlMode.charAt(0).toUpperCase() + controlMode.slice(1) },
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
        className={styles.boardWrapper}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className={styles.grid}>
          {tiles.map((val, idx) => {
            if (val === 0) {
              return <div key="blank" className={`${styles.tile} ${styles.tileEmpty}`} aria-hidden="true" />;
            }
            const isSlidable = !isWon && canSlide(tiles, idx);
            const isCorrect = val === idx + 1;
            let tileClass = styles.tile;
            if (isSlidable) tileClass += ` ${styles.tileSlidable}`;
            if (isCorrect) tileClass += ` ${styles.tileCorrect}`;
            return (
              <div
                key={val}
                className={tileClass}
                onClick={() => handleTileClick(idx)}
                onPointerDown={(e) => handleTilePointerDown(e, idx)}
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
        {controlMode === 'swipe' && 'Swipe Mode: Swipe on tiles or across the board in the direction of the blank space.'}
        {controlMode === 'hybrid' && 'Hybrid Mode: Both tap and swipe gestures are active simultaneously for fluid gameplay.'}
      </p>
    </div>
  );
};
