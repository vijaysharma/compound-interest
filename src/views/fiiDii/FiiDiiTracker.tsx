'use client';
import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { getFIIDIIDataAction } from '@/actions/fiiDii';
import {
  adjustFIIDIIPoints,
  aggregatePointsByInterval,
  isIntervalAllowedForTimeframe,
  type AdjustmentMode,
  type ViewMode,
  type Timeframe,
  type FlowInterval,
  type FIIDIIDataResponse,
} from '@/lib/fiiDii/fiiDiiCalculations';
import type { ChartType } from './FiiDiiChart';
import { FiiDiiSummaryCards } from './FiiDiiSummaryCards';
import { FiiDiiControls } from './FiiDiiControls';
import { FiiDiiExplanationSection } from './FiiDiiExplanationSection';
import styles from './FiiDiiTracker.module.scss';
const FiiDiiChart = dynamic(
  () => import('./FiiDiiChart').then((m) => ({ default: m.FiiDiiChart })),
  {
    ssr: false,
    loading: () => <div className={styles.chartLoading}>Loading chart…</div>,
  }
);
export const FiiDiiTracker: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1Y');
  const [interval, setInterval] = useState<FlowInterval>('daily');
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>('nominal');
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [showFii, setShowFii] = useState<boolean>(true);
  const [showDii, setShowDii] = useState<boolean>(true);
  const [showNifty, setShowNifty] = useState<boolean>(true);
  const [showSensex, setShowSensex] = useState<boolean>(false);
  const [baseData, setBaseData] = useState<FIIDIIDataResponse | null>(null);
  // Key of the request whose response is currently in `baseData`; pending while it lags the
  // selected timeframe/interval.
  const requestKey = `${timeframe}|${interval}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const isPending = loadedKey !== requestKey;
  const hasLoadedInitially = baseData !== null;
  const isMultiYear = timeframe === 'ALL' || timeframe === 'MAX';
  // Safe handler to ensure at least one of FII or DII remains active
  const handleToggleFii = (val: boolean) => {
    if (!val && !showDii) return; // Keep at least one active
    setShowFii(val);
  };
  const handleToggleDii = (val: boolean) => {
    if (!val && !showFii) return; // Keep at least one active
    setShowDii(val);
  };
  // When timeframe changes, validate interval and set sensible defaults
  const handleTimeframeChange = (newTf: Timeframe) => {
    setTimeframe(newTf);
    // If current interval is not allowed for the new timeframe, reset to daily
    if (!isIntervalAllowedForTimeframe(interval, newTf)) {
      setInterval('daily');
      return;
    }
    const isFyTf = typeof newTf === 'string' && newTf.startsWith('FY');
    if ((newTf === 'ALL' || newTf === 'MAX') && interval === 'daily') {
      setInterval('monthly');
    } else if (isFyTf && interval !== 'daily' && interval !== 'weekly' && interval !== 'monthly') {
      setInterval('monthly');
    }
  };
  // Deliberately not wrapped in startTransition: React entangles pending async transitions, so
  // a slow fetch held there would block every <Link> navigation until it resolved.
  useEffect(() => {
    let cancelled = false;
    const key = `${timeframe}|${interval}`;
    getFIIDIIDataAction({ timeframe, interval })
      .then((res) => {
        if (cancelled) return;
        setBaseData(res);
        setLoadedKey(key);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load FII/DII data:', err);
        setLoadedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [timeframe, interval]);
  // Client-side memoized instant recalculation when switching adjustment, view modes, or interval
  const displayData = useMemo(() => {
    if (!baseData) return null;
    const { points, summary } = adjustFIIDIIPoints(
      baseData.points,
      baseData.summary.cpiLatest,
      baseData.summary.pppLatest,
      adjustmentMode,
      viewMode,
      baseData.summary
    );
    // Instant client-side aggregation by selected interval
    const aggregatedPoints = aggregatePointsByInterval(points, interval);
    return {
      points: aggregatedPoints,
      summary,
      isMonthly: baseData.isMonthly || interval !== 'daily',
    };
  }, [baseData, adjustmentMode, viewMode, interval]);
  return (
    <main className={` ${styles.container} fii-dii-tracker`}>
      <header className={styles.header}>
        <div className={styles.headerBadge}>
          <span>Institutional Activity</span>
          {isMultiYear && <span className={styles.headerSubBadge}>• Multi-Year View</span>}
        </div>
        <h1 className={styles.mainTitle}>FII & DII Historical Flow Tracker</h1>
        <p className={styles.subtitle}>
          Analyze daily & cumulative net institutional market activity in India with real-time Nifty
          50 & Sensex overlays, benchmarked against CPI Inflation and World Bank Purchasing Power
          Parity.
        </p>
      </header>
      {/* 1. Summary Cards with Official Data Ingestion Callout */}
      <FiiDiiSummaryCards
        summary={displayData?.summary ?? null}
        nominalSummary={baseData?.summary ?? null}
        actualLatestDate={baseData?.actualLatestDate}
        isLoading={!hasLoadedInitially && isPending}
        isRefreshing={hasLoadedInitially && isPending}
      />
      {/* 2. Interactive Filters & Controls (Adjustment, View Mode, Overlays) */}
      <FiiDiiControls
        adjustmentMode={adjustmentMode}
        setAdjustmentMode={setAdjustmentMode}
        viewMode={viewMode}
        setViewMode={setViewMode}
        chartType={chartType}
        setChartType={setChartType}
        showFii={showFii}
        setShowFii={handleToggleFii}
        showDii={showDii}
        setShowDii={handleToggleDii}
        showNifty={showNifty}
        setShowNifty={setShowNifty}
        showSensex={showSensex}
        setShowSensex={setShowSensex}
        isLoading={isPending}
      />
      {/* 3. Dual Y-Axis Interactive Chart with Bar/Line toggle & in-graph top controls for Time Interval & Duration */}
      <FiiDiiChart
        points={displayData?.points ?? []}
        adjustmentMode={adjustmentMode}
        viewMode={viewMode}
        chartType={chartType}
        onChartTypeChange={setChartType}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        interval={interval}
        onIntervalChange={setInterval}
        showFii={showFii}
        showDii={showDii}
        showNifty={showNifty}
        showSensex={showSensex}
        isLoading={isPending}
      />
      {/* 4. Layman Guides, Formulas & Section Explanations */}
      <FiiDiiExplanationSection />
    </main>
  );
};
