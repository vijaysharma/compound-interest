'use client';
import React, { useState, useEffect, useTransition } from 'react';
import { getFIIDIIDataAction } from '@/actions/fiiDii';
import type {
  AdjustmentMode,
  ViewMode,
  Timeframe,
  FIIDIIDataResponse,
} from '@/lib/fiiDii/fiiDiiCalculations';
import { FiiDiiSummaryCards } from './FiiDiiSummaryCards';
import { FiiDiiControls } from './FiiDiiControls';
import { FiiDiiChart } from './FiiDiiChart';
import styles from './FiiDiiTracker.module.scss';
export const FiiDiiTracker: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('nominal');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [showNifty, setShowNifty] = useState<boolean>(true);
  const [showSensex, setShowSensex] = useState<boolean>(false);
  const [dataResponse, setDataResponse] = useState<FIIDIIDataResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasLoadedInitially, setHasLoadedInitially] = useState<boolean>(false);
  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await getFIIDIIDataAction({
          timeframe,
          adjustmentMode,
          viewMode,
        });
        setDataResponse(res);
        setHasLoadedInitially(true);
      } catch (err) {
        console.error('Failed to load FII/DII data:', err);
      }
    });
  }, [timeframe, adjustmentMode, viewMode]);
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerBadge}>
          <span>Institutional Activity</span>
        </div>
        <h1 className={styles.mainTitle}>FII & DII Historical Flow Tracker</h1>
        <p className={styles.subtitle}>
          Analyze daily & cumulative net institutional market activity in India with real-time Nifty 50
          & Sensex overlays, benchmarked against CPI Inflation and World Bank Purchasing Power Parity.
        </p>
      </header>
      {/* 1. Summary Cards */}
      <FiiDiiSummaryCards
        summary={dataResponse?.summary ?? null}
        isLoading={!hasLoadedInitially && isPending}
      />
      {/* 2. Interactive Filters & Controls */}
      <FiiDiiControls
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        adjustmentMode={adjustmentMode}
        setAdjustmentMode={setAdjustmentMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showNifty={showNifty}
        setShowNifty={setShowNifty}
        showSensex={showSensex}
        setShowSensex={setShowSensex}
        isLoading={isPending}
      />
      {/* 3. Dual Y-Axis Interactive Chart */}
      <FiiDiiChart
        points={dataResponse?.points ?? []}
        adjustmentMode={adjustmentMode}
        viewMode={viewMode}
        showNifty={showNifty}
        showSensex={showSensex}
        isLoading={!hasLoadedInitially && isPending}
      />
    </main>
  );
};
