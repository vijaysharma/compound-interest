import React, { useRef } from 'react';

export interface MobileButtonProps {
  action: () => void;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  'aria-label'?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  action,
  className,
  style,
  title,
  'aria-label': ariaLabel,
  disabled,
  children,
}) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const moved = useRef(false);

  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      style={style}
      title={title}
      aria-label={ariaLabel || title}
      onTouchStart={(e) => {
        // Prevent default on touchstart prevents iOS Safari from stealing focus / collapsing selection
        e.preventDefault();
        const t = e.touches[0];
        if (t) {
          startX.current = t.clientX;
          startY.current = t.clientY;
          lastX.current = t.clientX;
          lastY.current = t.clientY;
        }
        moved.current = false;
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) {
          const deltaX = t.clientX - lastX.current;
          const deltaY = t.clientY - lastY.current;
          lastX.current = t.clientX;
          lastY.current = t.clientY;

          if (Math.hypot(t.clientX - startX.current, t.clientY - startY.current) > 8) {
            moved.current = true;
          }

          // Smoothly scroll the nearest scrollable ancestor container if dragging
          let el: HTMLElement | null = (e.currentTarget as HTMLElement).parentElement;
          while (el && el !== document.body) {
            const style = window.getComputedStyle(el);
            const isHorizScroll =
              el.scrollWidth > el.clientWidth &&
              (style.overflowX === 'auto' || style.overflowX === 'scroll');
            const isVertScroll =
              el.scrollHeight > el.clientHeight &&
              (style.overflowY === 'auto' || style.overflowY === 'scroll');

            if (isHorizScroll || isVertScroll) {
              if (isHorizScroll && deltaX !== 0) el.scrollLeft -= deltaX;
              if (isVertScroll && deltaY !== 0) el.scrollTop -= deltaY;
              break;
            }
            el = el.parentElement;
          }
        }
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        if (!moved.current && !disabled) {
          action();
        }
        moved.current = false;
      }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={() => {
        if (!disabled) {
          action();
        }
      }}
    >
      {children}
    </button>
  );
};
