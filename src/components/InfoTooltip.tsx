'use client';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './InfoTooltip.module.scss';
interface InfoTooltipProps {
  ariaLabel: string;
  /** Preferred horizontal alignment relative to the icon; the popover is always clamped to the viewport. */
  align?: 'center' | 'right' | 'left';
  iconSize?: number;
  children: React.ReactNode;
}
const VIEWPORT_GUTTER = 12;
const GAP = 8;
const CLOSE_DELAY_MS = 120;
export const InfoTooltip = ({
  ariaLabel,
  align = 'center',
  iconSize = 13,
  children,
}: InfoTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const open = () => {
    cancelClose();
    setIsOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  };
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const popover = popoverRef.current;
    if (!trigger || !popover) return;
    const rect = trigger.getBoundingClientRect();
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    let left =
      align === 'right'
        ? rect.right - width
        : align === 'left'
          ? rect.left
          : rect.left + rect.width / 2 - width / 2;
    left = Math.min(Math.max(left, VIEWPORT_GUTTER), viewportWidth - width - VIEWPORT_GUTTER);
    // Flip above the icon when there is no room below.
    let top = rect.bottom + GAP;
    if (
      top + height > viewportHeight - VIEWPORT_GUTTER &&
      rect.top - GAP - height >= VIEWPORT_GUTTER
    ) {
      top = rect.top - GAP - height;
    }
    setPosition({ top, left });
  }, [align]);
  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);
  useEffect(() => cancelClose, []);
  const toggle = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cancelClose();
    setIsOpen((prev) => !prev);
  };
  return (
    <span
      className={styles.infoTooltipContainer}
      ref={triggerRef}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') toggle(e);
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {isOpen &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.infoPopover}
            role="tooltip"
            style={
              position
                ? { top: position.top, left: position.left }
                : { top: 0, left: 0, visibility: 'hidden' }
            }
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>,
          document.body
        )}
    </span>
  );
};
