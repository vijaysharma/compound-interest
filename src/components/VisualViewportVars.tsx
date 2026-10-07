'use client';
import { useEffect } from 'react';
/**
 * Publishes the visual viewport — the part of the screen actually visible — as CSS variables on
 * <html>: --vv-height and --vv-top. On phones the on-screen keyboard shrinks the visual viewport
 * but not the layout viewport that `position: fixed`, `vh` and `dvh` are measured against, so a
 * dialog sized with them ran under the keyboard and iOS scrolled the page behind it into view.
 * Dialogs size themselves to these variables on phones (see the below-app-chrome mixin).
 *
 * Also keeps a focused field in view once the keyboard has opened.
 */
export function VisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty('--vv-height', `${Math.round(vv.height)}px`);
      root.style.setProperty('--vv-top', `${Math.round(vv.offsetTop)}px`);
    };
    let lastHeight = vv.height;
    const handleResize = () => {
      update();
      const shrank = vv.height < lastHeight - 80;
      lastHeight = vv.height;
      // The keyboard just opened: bring the field being typed into back above it.
      const active = document.activeElement;
      if (shrank && active instanceof HTMLElement && active.matches('input, textarea, select, [contenteditable="true"]')) {
        setTimeout(() => active.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
      }
    };
    update();
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', update);
    };
  }, []);
  return null;
}
export default VisualViewportVars;
