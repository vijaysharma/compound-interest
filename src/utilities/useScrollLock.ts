import { useEffect } from 'react';
let lockCount = 0;
let initialBodyOverflow: string | null = null;
let initialHtmlOverflow: string | null = null;
export const forceUnlockScroll = () => {
  lockCount = 0;
  initialBodyOverflow = null;
  initialHtmlOverflow = null;
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.overflow = '';
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('pointer-events');
  }
};
export const useScrollLock = (isLocked: boolean = true) => {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;
    if (lockCount === 0) {
      const bodyOverflow = document.body.style.overflow;
      const htmlOverflow = document.documentElement.style.overflow;
      initialBodyOverflow = bodyOverflow && bodyOverflow !== 'hidden' ? bodyOverflow : '';
      initialHtmlOverflow = htmlOverflow && htmlOverflow !== 'hidden' ? htmlOverflow : '';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount++;
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        if (typeof document !== 'undefined') {
          document.body.style.overflow = initialBodyOverflow ?? '';
          if (!initialBodyOverflow) {
            document.body.style.removeProperty('overflow');
          }
          document.body.style.removeProperty('pointer-events');
          document.documentElement.style.overflow = initialHtmlOverflow ?? '';
          if (!initialHtmlOverflow) {
            document.documentElement.style.removeProperty('overflow');
          }
          document.documentElement.style.removeProperty('pointer-events');
        }
        initialBodyOverflow = null;
        initialHtmlOverflow = null;
      }
    };
  }, [isLocked]);
};
