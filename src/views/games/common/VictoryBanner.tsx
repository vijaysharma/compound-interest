'use client';
import React from 'react';
import Link from '@/navigation';
import { FiAward, FiStar } from 'react-icons/fi';
import { ConfettiCanvas } from './ConfettiCanvas';
import styles from './VictoryBanner.module.scss';
export interface VictoryStat {
  label: string;
  value: string | number;
}
export interface VictoryBannerProps {
  gameTitle: string;
  subtitle?: string;
  stats: VictoryStat[];
  isPersonalBest?: boolean;
  onPlayAgain: () => void;
  playAgainLabel?: string;
  hubHref?: string;
}
export const VictoryBanner: React.FC<VictoryBannerProps> = ({
  gameTitle,
  subtitle,
  stats,
  isPersonalBest,
  onPlayAgain,
  playAgainLabel = 'Play Again',
  hubHref = '/games',
}) => {
  return (
    <div className={styles.bannerContainer} role="region" aria-label="Game complete celebration">
      <ConfettiCanvas />
      <div className={styles.trophyIcon}>
        <FiAward size={48} />
      </div>
      <h2 className={styles.title}>Victory!</h2>
      <p className={styles.subtitle}>{subtitle || `You completed ${gameTitle}!`}</p>
      {isPersonalBest && (
        <div className={styles.personalBestBadge}>
          <FiStar size={14} />
          <span>New Personal Best!</span>
        </div>
      )}
      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statBox}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn} onClick={onPlayAgain}>
          {playAgainLabel}
        </button>
        <Link href={hubHref} className={styles.secondaryBtn}>
          All Games
        </Link>
      </div>
    </div>
  );
};
