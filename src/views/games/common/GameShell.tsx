'use client';

import React from 'react';
import { FiClock } from 'react-icons/fi';
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

export function GameShell({ children, className = '', ...rest }: GameShellProps) {
  return (
    <div className={`${styles.gameShell} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function GameShellHeader({
  title,
  subtitle,
  icon,
  actions,
  className = '',
}: GameShellHeaderProps) {
  return (
    <header className={`${styles.header} ${className}`.trim()}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>
          {icon && <span className={styles.titleBadge}>{icon}</span>}
          <span>{title}</span>
        </h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
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

GameShell.Header = GameShellHeader;
GameShell.Hud = GameShellHud;
GameShell.Board = GameShellBoard;
GameShell.Controls = GameShellControls;

export default GameShell;
