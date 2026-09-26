'use client';
import React, { useState, useRef, useEffect } from 'react';
import styles from './StrategyCalculator.module.scss';
interface InfoTooltipProps {
  ariaLabel: string;
  align?: 'center' | 'right' | 'left';
  children: React.ReactNode;
}
export const InfoTooltip = ({ align = 'center', children }: InfoTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);
  const alignClass =
    align === 'right'
      ? styles.infoPopoverRight
      : align === 'left'
        ? styles.infoPopoverLeft
        : styles.infoPopoverCenter;
  return (
    <span
      className={styles.infoTooltipContainer}
      ref={containerRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {isOpen && (
        <div className={`${styles.infoPopover} ${alignClass}`} role="tooltip">
          {children}
        </div>
      )}
    </span>
  );
};
