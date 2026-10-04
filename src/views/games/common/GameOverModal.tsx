'use client';
import React, { useEffect } from 'react';
import Link from '@/navigation';
import { ConfettiCanvas } from './ConfettiCanvas';
import type { ScoreBreakdown } from './scoring';
import { useAuth } from '@/context/useAuth';
import { FiUser, FiX, FiAward, FiAlertCircle, FiStar } from 'react-icons/fi';
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
  onClose?: () => void;
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
  onClose,
}) => {
  const [closed, setClosed] = React.useState(false);
  const { user } = useAuth();
  const isWon = outcome === 'won';
  const effectiveName = playerName || user?.user_alias || user?.name || null;
  const handleClose = () => {
    setClosed(true);
    if (onClose) onClose();
  };
  useEffect(() => {
    if (closed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [closed]);
  if (closed) return null;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Game complete summary"
      onClick={handleClose}
    >
      <div
        className={`${styles.bannerContainer} ${!isWon ? styles.bannerDefeat : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close summary"
          title="Close"
        >
          <FiX size={20} />
        </button>
        {isWon && <ConfettiCanvas />}
        <div className={styles.iconHeader}>{isWon ? <FiAward size={48} /> : <FiAlertCircle size={48} />}</div>
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
            <FiStar className={styles.starIcon} size={15} />
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
          <button type="button" className={styles.secondaryBtn} onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
export { GameOverModal as VictoryBanner };
