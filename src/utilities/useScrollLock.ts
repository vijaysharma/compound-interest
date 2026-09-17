import { useEffect } from 'react';
export const useScrollLock = (isLocked: boolean = true) => {
  useEffect(() => {
    if (!isLocked) return;
    // Save original overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;
    // Lock scroll
    document.body.style.overflow = 'hidden';
    return () => {
      // Restore scroll
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
};
