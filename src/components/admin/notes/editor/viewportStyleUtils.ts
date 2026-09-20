import { ViewportState } from './types';
export function applyContainerViewportStyles(
  el: HTMLDivElement | null,
  isMobileScreen?: boolean,
  viewportState?: ViewportState
): void {
  if (!el) return;
  if (isMobileScreen && viewportState) {
    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.right = '0';
    el.style.top = `${viewportState.offsetTop}px`;
    el.style.height = `${viewportState.height}px`;
    el.style.zIndex = '40';
    el.style.maxHeight = '';
  } else {
    el.style.position = '';
    el.style.left = '';
    el.style.right = '';
    el.style.top = '';
    el.style.zIndex = '';
    el.style.height = '100%';
    el.style.maxHeight = '100%';
  }
}
