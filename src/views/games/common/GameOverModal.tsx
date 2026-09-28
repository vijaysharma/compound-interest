'use client';
import React, { useEffect } from 'react';
import Link from '@/navigation';
import { ConfettiCanvas } from './ConfettiCanvas';
import type { ScoreBreakdown } from './scoring';
import styles from './GameOverModal.module.scss';
export interface GameOverModalProps {
  outcome: 'won' | 'lost';
  gameTitle: string;
  subtitle?: string;
  scoreBreakdown?: ScoreBreakdown;
  timeSeconds: number;
  stats?: Array<{ label: string; value: string | number }>;
  isPersonalBest?: boolean;
  userRank?: number;
  onPlayAgain: () => void;
  playAgainLabel?: string;
  hubHref?: string;
}
export const GameOverModal: React.FC<GameOverModalProps> = ({
  outcome,
  gameTitle,
  subtitle,
  scoreBreakdown,
  timeSeconds,
  stats = [],
  isPersonalBest,
  userRank,
  onPlayAgain,
  playAgainLabel = 'Play Again',
  hubHref = '/games',
}) => {
  const isWon = outcome === 'won';
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Game complete summary">
      <div className={`${styles.bannerContainer} ${!isWon ? styles.bannerDefeat : ''}`}>
        {isWon && <ConfettiCanvas />}
        <div className={styles.iconHeader}>{isWon ? '🏆' : '💥'}</div>
        <h2 className={`${styles.title} ${!isWon ? styles.titleDefeat : ''}`}>
          {isWon ? 'Victory!' : 'Game Over'}
        </h2>
        <p className={styles.subtitle}>
          {subtitle || (isWon ? `You mastered ${gameTitle}!` : `Better luck next time in ${gameTitle}`)}
        </p>
        {isWon && isPersonalBest && (
          <div className={styles.personalBestBadge}>
            <span>🌟</span>
            <span>New Personal Best!</span>
          </div>
        )}
        {scoreBreakdown && (
          <div className={styles.scoreHighlightCard}>
            <span className={styles.scoreHighlightLabel}>Total Points Earned</span>
            <span className={styles.scoreHighlightValue}>{scoreBreakdown.totalPoints}</span>
            {userRank !== undefined && (
              <span className={styles.rankText}>Leaderboard Rank: #{userRank}</span>
            )}
          </div>
        )}
        {scoreBreakdown && (
          <div className={styles.scoreBreakdownGrid}>
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownLabel}>Base Score</span>
              <span className={styles.breakdownVal}>{scoreBreakdown.baseScore}</span>
            </div>
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownLabel}>Time Bonus</span>
              <span className={styles.breakdownVal}>+{scoreBreakdown.timeBonus}</span>
            </div>
            <div className={styles.breakdownBox}>
              <span className={styles.breakdownLabel}>Multiplier</span>
              <span className={styles.breakdownVal}>{scoreBreakdown.difficultyMultiplier}x</span>
            </div>
          </div>
        )}
        <div className={styles.statsList}>
          <span className={styles.statItem}>
            Time: <strong>{formatTime(timeSeconds)}</strong>
          </span>
          {stats.map((s) => (
            <span key={s.label} className={styles.statItem}>
              {s.label}: <strong>{s.value}</strong>
            </span>
          ))}
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn} onClick={onPlayAgain}>
            {playAgainLabel}
          </button>
          <Link href="/games?tab=leaderboard" className={styles.secondaryBtn}>
            Leaderboard
          </Link>
          <Link href={hubHref} className={styles.secondaryBtn}>
            All Games
          </Link>
        </div>
      </div>
    </div>
  );
};
export { GameOverModal as VictoryBanner };
