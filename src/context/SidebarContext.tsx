'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
}
const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
  toggleSidebar: () => {},
});
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsedState] = useState<boolean>(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem('app_sidebar_collapsed');
      if (saved !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCollapsedState(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);
  const setIsCollapsed = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem('app_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);
  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
export const useSidebar = () => useContext(SidebarContext);
