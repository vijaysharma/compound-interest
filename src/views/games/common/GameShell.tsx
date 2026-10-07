'use client';

import React from 'react';
import { FiClock } from 'react-icons/fi';
import { HowToPlayButton } from './HowToPlayModal';
import styles from './GameShell.module.scss';

export interface GameShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export interface GameShellHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export interface GameShellHudProps {
  timerSeconds?: number;
  formattedTime?: string;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export interface GameShellBoardProps {
  children: React.ReactNode;
  banner?: React.ReactNode;
  className?: string;
}

export interface GameShellControlsProps {
  children: React.ReactNode;
  className?: string;
}

export interface GameShellInfoProps {
  onHowToPlay: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function GameShell({ children, className = '', ...rest }: GameShellProps) {
  return (
    <div className={`${styles.gameShell} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

/**
 * The game's top toolbar. The top bar already names the game, so the title and subtitle are
 * kept only for search engines and screen readers (visually hidden); `actions` — timer, text
 * size, pause/quit — are what shows.
 */
export function GameShellHeader({
  title,
  subtitle,
  icon,
  actions,
  className = '',
}: GameShellHeaderProps) {
  return (
    <header className={`${styles.header} ${className}`.trim()}>
      <div className={styles.visuallyHidden}>
        <h1>
          {icon}
          {title}
        </h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className={styles.headerActions}>{actions}</div>}
    </header>
  );
}

export function GameShellHud({
  timerSeconds,
  formattedTime,
  badges,
  actions,
  children,
  className = '',
}: GameShellHudProps) {
  const displayTime =
    formattedTime ??
    (timerSeconds !== undefined
      ? `${Math.floor(timerSeconds / 60)
          .toString()
          .padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`
      : undefined);

  return (
    <div className={`${styles.hud} ${className}`.trim()} role="region" aria-label="Game HUD">
      <div className={styles.hudGroup}>
        {displayTime !== undefined && (
          <div className={styles.timerBadge} aria-label={`Elapsed time: ${displayTime}`}>
            <FiClock aria-hidden="true" />
            <span>{displayTime}</span>
          </div>
        )}
        {badges}
      </div>
      {(actions || children) && (
        <div className={styles.hudGroup}>
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

export function GameShellBoard({ children, banner, className = '' }: GameShellBoardProps) {
  return (
    <div className={`${styles.boardCard} ${className}`.trim()}>
      {banner && <div className={styles.hintBanner}>{banner}</div>}
      {children}
    </div>
  );
}

export function GameShellControls({ children, className = '' }: GameShellControlsProps) {
  return (
    <div className={`${styles.controls} ${className}`.trim()} role="group" aria-label="Game controls">
      {children}
    </div>
  );
}

/** Below the board and its controls: "How to play", then any rules, tips or stats. */
export function GameShellInfo({ onHowToPlay, children, className = '' }: GameShellInfoProps) {
  return (
    <section className={`${styles.info} ${className}`.trim()} aria-label="How to play and game information">
      <div className={styles.infoHowTo}>
        <HowToPlayButton onClick={onHowToPlay} label="How to play" />
      </div>
      {children}
    </section>
  );
}

GameShell.Header = GameShellHeader;
GameShell.Hud = GameShellHud;
GameShell.Board = GameShellBoard;
GameShell.Controls = GameShellControls;
GameShell.Info = GameShellInfo;

export default GameShell;
