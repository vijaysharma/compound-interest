import { RefObject, useState, useEffect } from 'react';
import { DropdownType, MobileMenuType, ViewportState } from './types';
import { scrollSelectionIntoView } from './scrollSelectionUtils';
import styles from '../NotesEditor.module.scss';
interface UseEditorViewportParams {
  editorRef: RefObject<HTMLDivElement | null>;
  canvasContainerRef: RefObject<HTMLDivElement | null>;
}
export function useEditorViewport({
  editorRef,
  canvasContainerRef,
}: UseEditorViewportParams) {
  const [viewportState, setViewportState] = useState<ViewportState>(() => {
    if (typeof window !== 'undefined' && window.visualViewport) {
      return {
        height: window.visualViewport.height,
        offsetTop: window.visualViewport.offsetTop,
      };
    }
    return null;
  });
  const [activeMobileMenu, setActiveMobileMenu] = useState<MobileMenuType>(null);
  const [activeDropdown, setActiveDropdown] = useState<DropdownType>(null);
  useEffect(() => {
    if (!activeDropdown) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(`.${styles.dropdownContainer}`)) return;
      setActiveDropdown(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDropdown]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleViewportChange = () => {
      setViewportState((prev) => {
        const height = Math.round(vv.height);
        const offsetTop = Math.round(vv.offsetTop);
        if (prev && prev.height === height && prev.offsetTop === offsetTop) {
          return prev;
        }
        return { height, offsetTop };
      });
      if (editorRef.current && (document.activeElement === editorRef.current || editorRef.current.contains(document.activeElement))) {
        scrollSelectionIntoView(editorRef.current, canvasContainerRef.current, { block: 'nearest' });
      }
    };
    handleViewportChange();
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);
    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, [editorRef, canvasContainerRef]);

  return {
    viewportState,
    activeMobileMenu,
    setActiveMobileMenu,
    activeDropdown,
    setActiveDropdown,
  };
}
