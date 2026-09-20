import { useState, useMemo, useEffect, useCallback } from 'react';
import { Streamline } from './types';
import { DEFAULT_STREAMLINES } from './strategyPresets';
import { runStrategySimulation } from './strategyEngine';
import { syncFundNavs } from './strategyNavService';
export function useStreamlinesState() {
  const [streamlines, setStreamlines] = useState<Streamline[]>(DEFAULT_STREAMLINES);
  const [activeId, setActiveId] = useState<string>(DEFAULT_STREAMLINES[0].id);
  const [isSaved, setIsSaved] = useState(false);
  const [navSyncCount, setNavSyncCount] = useState(0);
  const activeStreamline = useMemo(() => {
    return streamlines.find((s) => s.id === activeId) || streamlines[0];
  }, [streamlines, activeId]);
  // Sync fund NAVs from cache / API
  useEffect(() => {
    const allCodes = new Set<string>();
    streamlines.forEach((s) => {
      s.sourceFunds.forEach((f) => allCodes.add(f.schemeCode));
      s.sipFunds.forEach((f) => allCodes.add(f.schemeCode));
    });
    syncFundNavs(Array.from(allCodes)).then(() => {
      setNavSyncCount((c) => c + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamlines.length]);
  const updateActive = useCallback((updater: Partial<Streamline>) => {
    setStreamlines((prev) =>
      prev.map((s) => (s.id === activeId ? { ...s, ...updater } : s))
    );
    setIsSaved(false);
  }, [activeId]);
  const saveStreamline = useCallback(() => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  }, []);
  const duplicateStreamline = useCallback(() => {
    if (streamlines.length >= 3) return;
    const colors = ['#7b1fa2', '#0284c7', '#10b981'];
    const newId = `streamline-${Date.now()}`;
    const nextColor = colors[streamlines.length] || '#f59e0b';
    const cloned: Streamline = {
      ...activeStreamline,
      id: newId,
      name: `${activeStreamline.name} (Copy)`,
      color: nextColor,
    };
    setStreamlines((prev) => [...prev, cloned]);
    setActiveId(newId);
  }, [streamlines.length, activeStreamline]);
  const addStreamline = useCallback(() => {
    if (streamlines.length >= 3) return;
    const colors = ['#7b1fa2', '#0284c7', '#10b981'];
    const newId = `streamline-${Date.now()}`;
    const nextColor = colors[streamlines.length] || '#ec4899';
    const brandNew: Streamline = {
      id: newId,
      name: `Strategy Streamline ${streamlines.length + 1}`,
      color: nextColor,
      investmentDate: '2024-01-01',
      investmentAmount: '5000000',
      sourceFunds: activeStreamline.sourceFunds,
      swpConfig: { ...activeStreamline.swpConfig, baseAmount: 30000 },
      sipConfig: { ...activeStreamline.sipConfig },
      sipFunds: activeStreamline.sipFunds,
      topUps: [],
      durationYears: 10,
    };
    setStreamlines((prev) => [...prev, brandNew]);
    setActiveId(newId);
  }, [streamlines.length, activeStreamline]);
  const deleteStreamline = useCallback((id: string) => {
    if (streamlines.length <= 1) return;
    setStreamlines((prev) => prev.filter((s) => s.id !== id));
    if (activeId === id) {
      const remaining = streamlines.filter((s) => s.id !== id);
      setActiveId(remaining[0].id);
    }
  }, [streamlines, activeId]);
  // Compute simulation for all streamlines for multi-comparison
  const allStreamlineResults = useMemo(() => {
    // navSyncCount is dependency so it updates after NAV sync
    if (navSyncCount < 0) return [];
    return streamlines.map((s) => {
      const numericAmount = parseFloat(s.investmentAmount) || 0;
      const res = runStrategySimulation(
        s.investmentDate,
        numericAmount,
        s.sourceFunds,
        s.swpConfig,
        s.sipConfig,
        s.sipFunds,
        s.topUps,
        s.durationYears * 12
      );
      return { streamline: s, result: res };
    });
  }, [streamlines, navSyncCount]);
  const activeResult = useMemo(() => {
    const found = allStreamlineResults.find((r) => r.streamline.id === activeId);
    return found ? found.result : allStreamlineResults[0]?.result;
  }, [allStreamlineResults, activeId]);
  return {
    streamlines,
    activeId,
    setActiveId,
    activeStreamline,
    updateActive,
    saveStreamline,
    duplicateStreamline,
    addStreamline,
    deleteStreamline,
    isSaved,
    activeResult,
    allStreamlineResults,
  };
}
