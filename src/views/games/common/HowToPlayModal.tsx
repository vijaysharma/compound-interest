'use client';
import React, { useEffect, useRef } from 'react';
import { FiX, FiHelpCircle } from 'react-icons/fi';
import styles from './HowToPlayModal.module.scss';

export interface HowToPlaySection {
  title: string;
  items: (string | React.ReactNode)[];
}

export interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  objective: string;
  rules: (string | React.ReactNode)[];
  controls: {
    desktop?: string;
    mobile?: string;
    shortcuts?: string;
  };
  tips?: string[];
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  objective,
  rules,
  controls,
  tips,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal} ref={dialogRef}>
        <div className={styles.header}>
          <div className={styles.titleWrap}>
            <FiHelpCircle className={styles.titleIcon} />
            <h2 id="how-to-play-title" className={styles.title}>
              How to Play {gameTitle}
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close guide"
          >
            <FiX size={18} />
          </button>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>🎯 Objective</h3>
            <p className={styles.objectiveText}>{objective}</p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>📜 Rules</h3>
            <ul className={styles.list}>
              {rules.map((rule, idx) => (
                <li key={idx} className={styles.listItem}>
                  {rule}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionHeading}>🎮 Controls</h3>
            <div className={styles.controlsGrid}>
              {controls.desktop && (
                <div className={styles.controlBox}>
                  <span className={styles.controlBoxLabel}>💻 Desktop</span>
                  <p className={styles.controlBoxDesc}>{controls.desktop}</p>
                </div>
              )}
              {controls.mobile && (
                <div className={styles.controlBox}>
                  <span className={styles.controlBoxLabel}>📱 Mobile / Touch</span>
                  <p className={styles.controlBoxDesc}>{controls.mobile}</p>
                </div>
              )}
              {controls.shortcuts && (
                <div className={styles.controlBox}>
                  <span className={styles.controlBoxLabel}>⌨️ Shortcuts</span>
                  <p className={styles.controlBoxDesc}>{controls.shortcuts}</p>
                </div>
              )}
            </div>
          </section>

          {tips && tips.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>💡 Tips & Strategies</h3>
              <ul className={styles.list}>
                {tips.map((tip, idx) => (
                  <li key={idx} className={styles.listItem}>
                    {tip}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.gotItBtn} onClick={onClose}>
            Got it, let's play!
          </button>
        </div>
      </div>
    </div>
  );
};

export const HowToPlayButton: React.FC<{ onClick: () => void; label?: string; compact?: boolean }> = ({
  onClick,
  label = 'How to Play',
  compact = false,
}) => {
  return (
    <button
      type="button"
      className={`${styles.triggerBtn} ${compact ? styles.triggerBtnCompact : ''}`}
      onClick={onClick}
      title="How to Play"
      aria-label="How to Play"
    >
      <FiHelpCircle className={styles.triggerIcon} />
      <span>{label}</span>
    </button>
  );
};
