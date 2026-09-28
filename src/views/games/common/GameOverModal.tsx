'use client';
import React, { useEffect } from 'react';
import Link from '@/navigation';
import { ConfettiCanvas } from './ConfettiCanvas';
import type { ScoreBreakdown } from './scoring';
import { useAuth } from '@/context/useAuth';
import { FiUser } from 'react-icons/fi';
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
  playerName?: string;
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
  playerName,
  onPlayAgain,
  playAgainLabel = 'Play Again',
  hubHref = '/games',
}) => {
  const { user } = useAuth();
  const isWon = outcome === 'won';
  const effectiveName = playerName || user?.user_alias || user?.name || null;
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
        {effectiveName && (
          <div className={styles.playerBadge}>
            <FiUser className={styles.playerBadgeIcon} />
            <span>{effectiveName.startsWith('@') ? effectiveName : `@${effectiveName}`}</span>
          </div>
        )}
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
