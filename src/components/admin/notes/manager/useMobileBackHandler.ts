'use client';
import { useEffect, useRef } from 'react';
interface UseMobileBackHandlerProps {
  isMobile: boolean;
  mobileScreen: 'folders' | 'list' | 'editor';
  setMobileScreen: (screen: 'folders' | 'list' | 'editor') => void;
}
export function useMobileBackHandler({
  isMobile,
  mobileScreen,
  setMobileScreen,
}: UseMobileBackHandlerProps) {
  const mobileScreenRef = useRef(mobileScreen);
  useEffect(() => {
    mobileScreenRef.current = mobileScreen;
  }, [mobileScreen]);
  const parkedEntryRef = useRef(false);
  const ignorePopCountRef = useRef(0);
  useEffect(() => {
    const onPopState = () => {
      if (ignorePopCountRef.current > 0) {
        ignorePopCountRef.current -= 1;
        return;
      }
      if (!parkedEntryRef.current) return;
      parkedEntryRef.current = false;
      const current = mobileScreenRef.current;
      if (current === 'editor') setMobileScreen('list');
      else if (current === 'list') setMobileScreen('folders');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setMobileScreen]);
  useEffect(() => {
    const needsEntry = isMobile && mobileScreen !== 'folders';
    if (needsEntry && !parkedEntryRef.current) {
      parkedEntryRef.current = true;
      window.history.pushState({ quickNotesScreen: true }, '');
    } else if (!needsEntry && parkedEntryRef.current) {
      parkedEntryRef.current = false;
      ignorePopCountRef.current += 1;
      window.history.back();
    }
  }, [isMobile, mobileScreen]);
}
