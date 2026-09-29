'use client';
import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { getFIIDIIDataAction } from '@/actions/fiiDii';
import {
  adjustFIIDIIPoints,
  type AdjustmentMode,
  type ViewMode,
  type Timeframe,
  type FIIDIIDataResponse,
} from '@/lib/fiiDii/fiiDiiCalculations';
import { FiiDiiSummaryCards } from './FiiDiiSummaryCards';
import { FiiDiiControls } from './FiiDiiControls';
import { FiiDiiChart, type ChartType } from './FiiDiiChart';
import { FiiDiiExplanationSection } from './FiiDiiExplanationSection';
import styles from './FiiDiiTracker.module.scss';
export const FiiDiiTracker: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('nominal');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [showNifty, setShowNifty] = useState<boolean>(true);
  const [showSensex, setShowSensex] = useState<boolean>(false);
  const [baseData, setBaseData] = useState<FIIDIIDataResponse | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasLoadedInitially, setHasLoadedInitially] = useState<boolean>(false);
  // Fetch dataset only when timeframe selection changes
  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await getFIIDIIDataAction({ timeframe });
        setBaseData(res);
        setHasLoadedInitially(true);
      } catch (err) {
        console.error('Failed to load FII/DII data:', err);
      }
    });
  }, [timeframe]);
  // Client-side memoized instant recalculation when switching adjustment or view modes
  const displayData = useMemo(() => {
    if (!baseData) return null;
    const { points, summary } = adjustFIIDIIPoints(
      baseData.points,
      baseData.summary.cpiLatest,
      baseData.summary.pppLatest,
      adjustmentMode,
      viewMode
    );
    return {
      points,
      summary,
      isMonthly: baseData.isMonthly,
    };
  }, [baseData, adjustmentMode, viewMode]);
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerBadge}>
          <span>Institutional Activity</span>
          {(timeframe === 'ALL' || timeframe === 'MAX') && (
            <span className={styles.headerSubBadge}>• Monthly Bucketed</span>
          )}
        </div>
        <h1 className={styles.mainTitle}>FII & DII Historical Flow Tracker</h1>
        <p className={styles.subtitle}>
          Analyze daily & cumulative net institutional market activity in India with real-time Nifty 50
          & Sensex overlays, benchmarked against CPI Inflation and World Bank Purchasing Power Parity.
        </p>
      </header>
      {/* 1. Summary Cards with Data Ingestion Callout */}
      <FiiDiiSummaryCards
        summary={displayData?.summary ?? null}
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
        chartType={chartType}
        setChartType={setChartType}
        showNifty={showNifty}
        setShowNifty={setShowNifty}
        showSensex={showSensex}
        setShowSensex={setShowSensex}
        isLoading={isPending}
      />
      {/* 3. Dual Y-Axis Interactive Chart with Bar/Line toggle & direct interval chips */}
      <FiiDiiChart
        points={displayData?.points ?? []}
        adjustmentMode={adjustmentMode}
        viewMode={viewMode}
        chartType={chartType}
        onChartTypeChange={setChartType}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        showNifty={showNifty}
        showSensex={showSensex}
        isLoading={!hasLoadedInitially && isPending}
      />
      {/* 4. Layman Guides, Formulas & Section Explanations */}
      <FiiDiiExplanationSection />
    </main>
  );
};
