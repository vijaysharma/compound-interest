'use client';
import React from 'react';
import Link from '@/navigation';
import { FiLogOut, FiPause } from 'react-icons/fi';
import styles from './QuitModal.module.scss';
export interface QuitModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmQuit?: () => void;
  gameTitle?: string;
  hubHref?: string;
}
export const QuitModal: React.FC<QuitModalProps> = ({
  isOpen,
  onCancel,
  onConfirmQuit,
  gameTitle = 'this puzzle',
  hubHref = '/games',
}) => {
  if (!isOpen) return null;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="quit-modal-title">
      <div className={styles.modal}>
        <div className={styles.icon}>
          <FiPause size={32} />
        </div>
        <h3 id="quit-modal-title" className={styles.title}>Game Paused</h3>
        <p className={styles.message}>
          Are you sure you want to quit {gameTitle}? Any unsaved progress will be forfeited.
        </p>
        <div className={styles.buttonRow}>
          <button type="button" className={styles.resumeBtn} onClick={onCancel}>
            Resume Game
          </button>
          <Link
            href={hubHref}
            className={styles.quitBtn}
            onClick={() => {
              if (onConfirmQuit) onConfirmQuit();
            }}
          >
            Quit to Menu
          </Link>
        </div>
      </div>
    </div>
  );
};
export const QuitButton: React.FC<{ onClick: () => void; label?: string }> = ({
  onClick,
  label = 'Quit Game',
}) => {
  return (
    <button type="button" className={styles.quitTriggerBtn} onClick={onClick} title="Pause & Exit Game">
      <FiLogOut />
      <span>{label}</span>
    </button>
  );
};
