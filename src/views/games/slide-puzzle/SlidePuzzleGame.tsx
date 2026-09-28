'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { canSlide, getShuffledBoard, isSolved, slideInDirection, slideTiles } from './engine';
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
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const resetGame = useCallback(() => {
    setTiles(getShuffledBoard());
    setMoves(0);
    setElapsedSeconds(0);
    setIsWon(false);
    setIsStarted(false);
    setPersonalBest(false);
    setScoreBreakdown(null);
  }, []);
  useEffect(() => {
    if (!isStarted || isWon) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isWon]);
  const handleTileClick = (idx: number) => {
    if (isWon) return;
    const result = slideTiles(tiles, idx);
    if (!result) return;
    if (!isStarted) setIsStarted(true);
    const nextMoves = moves + 1;
    setTiles(result.newTiles);
    setMoves(nextMoves);
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
  };
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || isWon) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;
    const minSwipe = 30;
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;
    let dir: 'up' | 'down' | 'left' | 'right';
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }
    const result = slideInDirection(tiles, dir);
    if (!result) return;
    if (!isStarted) setIsStarted(true);
    const nextMoves = moves + 1;
    setTiles(result.newTiles);
    setMoves(nextMoves);
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
  };
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
            { label: 'Grid', value: '4x4' },
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
        Tap any highlighted tile in the blank space&apos;s row or column to slide it, or swipe across the board.
      </p>
    </div>
  );
};
