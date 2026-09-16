'use client';
import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AgCharts } from 'ag-charts-react';
import {
  CartesianChartModule,
  CategoryAxisModule,
  LegendModule,
  LineSeriesModule,
  LocaleModule,
  ModuleRegistry,
  NumberAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions } from 'ag-charts-types';
import Spinner from './Spinner';
import styles from './Chart.module.scss';
if (typeof window !== 'undefined') {
  ModuleRegistry.registerModules([
    CartesianChartModule,
    LineSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    LegendModule,
    LocaleModule,
  ]);
}
interface ChartPoint {
  date: string;
  nav: number;
}
interface ChartDataset {
  label: string;
  color: string;
  data: ChartPoint[];
}
interface ChartProps {
  className: string;
  datasets: ChartDataset[];
  investmentAmount: number;
  dataMode?: 'nav' | 'value';
  height?: number | 'auto';
  autoHeight?: boolean;
  minHeight?: number;
  enableZoom?: boolean;
  showPresets?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  emptyMessage?: string;
  startDate?: string | null;
  endDate?: string | null;
}
/*
 * NAV dates are DD-MM-YYYY.
 *
 * Do not use:
 *
 * new Date("24-08-2026")
 *
 * because that format is not reliably parsed by JavaScript.
 */
const getDateTime = (date: string): number => {
  const parts = date.split('-');
  if (parts.length !== 3) {
    return Number.NaN;
  }
  if (parts[0].length === 4) {
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    return Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)
      ? new Date(year, month, day).getTime()
      : Number.NaN;
  }
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return Number.NaN;
  }
  return new Date(year, month, day).getTime();
};
/*
 * Format investment values for tooltips.
 */
const formatCurrency = (value: number): string =>
  `₹${value.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
const formatAxisCurrency = (value: number): string => {
  const absoluteValue = Math.abs(value);
  if (absoluteValue >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (absoluteValue >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (absoluteValue >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
};
const emptySubscribe = () => () => {};
const Chart = ({
  className,
  datasets,
  investmentAmount,
  dataMode = 'nav',
  height,
  autoHeight = false,
  minHeight = 0,
  enableZoom = true,
  showPresets = false,
  isLoading = false,
  loadingLabel,
  emptyMessage,
  startDate,
  endDate,
}: ChartProps) => {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [userZoom, setUserZoom] = useState<{ start: string; end: string } | 'all' | null>(null);
  const [userPreset, setUserPreset] = useState<string | null>(null);
  const matchedKey = `${startDate || ''}:${endDate || ''}`;
  const [prevMatchedKey, setPrevMatchedKey] = useState(matchedKey);
  if (prevMatchedKey !== matchedKey) {
    setPrevMatchedKey(matchedKey);
    setUserZoom(null);
    setUserPreset(null);
  }
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    currentX: number;
  } | null>(null);
  const initialInvestment =
    Number.isFinite(investmentAmount) && investmentAmount > 0 ? investmentAmount : 0;
  // Compute all unique dates sorted chronologically
  const allSortedDates = useMemo(() => {
    const uniqueDateTimes = new Map<string, number>();
    for (const dataset of datasets) {
      for (const point of dataset.data) {
        if (Number.isFinite(point.nav) && point.nav > 0) {
          const time = getDateTime(point.date);
          if (Number.isFinite(time) && !uniqueDateTimes.has(point.date)) {
            uniqueDateTimes.set(point.date, time);
          }
        }
      }
    }
    return Array.from(uniqueDateTimes.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([date]) => date);
  }, [datasets]);
  // Compute initial matched range based on provided startDate and endDate
  const matchedRange = useMemo(() => {
    if (allSortedDates.length === 0) return null;
    let startIdx = 0;
    let endIdx = allSortedDates.length - 1;
    if (startDate) {
      const targetStartTime = getDateTime(startDate);
      if (Number.isFinite(targetStartTime)) {
        for (let i = 0; i < allSortedDates.length; i++) {
          if (getDateTime(allSortedDates[i]) >= targetStartTime) {
            startIdx = i;
            break;
          }
        }
      }
    }
    if (endDate) {
      const targetEndTime = getDateTime(endDate);
      if (Number.isFinite(targetEndTime)) {
        for (let i = allSortedDates.length - 1; i >= 0; i--) {
          if (getDateTime(allSortedDates[i]) <= targetEndTime) {
            endIdx = i;
            break;
          }
        }
      }
    }
    if (startIdx <= endIdx && (startDate || endDate)) {
      return {
        start: allSortedDates[startIdx],
        end: allSortedDates[endIdx],
      };
    }
    return null;
  }, [allSortedDates, startDate, endDate]);
  // Derived zoom range: if user hasn't zoomed, default to matchedRange
  const zoomRange = userZoom === 'all' ? null : (userZoom ?? matchedRange);
  const activePreset =
    userZoom === 'all' ? 'All' : userZoom === null && !matchedRange ? 'All' : userPreset;
  // Compute active dates based on zoom
  const activeDates = useMemo(() => {
    if (!zoomRange || allSortedDates.length === 0) return allSortedDates;
    const startIdx = allSortedDates.indexOf(zoomRange.start);
    const endIdx = allSortedDates.indexOf(zoomRange.end);
    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return allSortedDates;
    return allSortedDates.slice(startIdx, endIdx + 1);
  }, [allSortedDates, zoomRange]);
  const handleApplyPreset = (preset: string) => {
    setUserPreset(preset);
    if (preset === 'All' || allSortedDates.length === 0) {
      setUserZoom('all');
      return;
    }
    const daysMap: Record<string, number> = {
      '1M': 30,
      '6M': 180,
      '1Y': 365,
      '3Y': 365 * 3,
      '5Y': 365 * 5,
    };
    const days = daysMap[preset];
    if (!days) return;
    const baseEnd = matchedRange?.end || allSortedDates[allSortedDates.length - 1];
    const baseEndTime = getDateTime(baseEnd);
    const targetStartTime = baseEndTime - days * 24 * 60 * 60 * 1000;
    let targetIdx = 0;
    for (let i = 0; i < allSortedDates.length; i++) {
      if (getDateTime(allSortedDates[i]) >= targetStartTime) {
        targetIdx = i;
        break;
      }
    }
    const endIdx = allSortedDates.indexOf(baseEnd);
    if (targetIdx <= endIdx && endIdx !== -1) {
      setUserZoom({
        start: allSortedDates[targetIdx],
        end: baseEnd,
      });
    }
  };
  const handleResetZoom = () => {
    setUserZoom(null);
    setUserPreset(null);
  };
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableZoom || !containerRef.current || allSortedDates.length < 5) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setDragState({ isDragging: true, startX: x, currentX: x });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState?.isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setDragState((prev) => (prev ? { ...prev, currentX: x } : null));
  };
  const handleMouseUp = () => {
    if (!dragState?.isDragging || !containerRef.current) {
      setDragState(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const leftPx = Math.min(dragState.startX, dragState.currentX);
    const rightPx = Math.max(dragState.startX, dragState.currentX);
    const diff = rightPx - leftPx;
    if (diff > 15 && activeDates.length > 5) {
      const chartWidth = rect.width;
      const startRatio = Math.max(0, Math.min(leftPx / chartWidth, 1));
      const endRatio = Math.max(0, Math.min(rightPx / chartWidth, 1));
      const startIdx = Math.floor(startRatio * activeDates.length);
      const endIdx = Math.min(activeDates.length - 1, Math.ceil(endRatio * activeDates.length));
      if (endIdx - startIdx >= 2) {
        setUserZoom({
          start: activeDates[startIdx],
          end: activeDates[endIdx],
        });
        setUserPreset(null);
      }
    }
    setDragState(null);
  };
  const chartOptions = useMemo<AgCartesianChartOptions | null>(() => {
    if (datasets.length === 0 || initialInvestment <= 0 || activeDates.length === 0) {
      return null;
    }
    const normalizedDatasets = datasets.map((dataset) => {
      const validPoints: { date: string; time: number; nav: number }[] = [];
      for (const point of dataset.data) {
        if (Number.isFinite(point.nav) && point.nav > 0) {
          const time = getDateTime(point.date);
          if (Number.isFinite(time)) {
            validPoints.push({ date: point.date, time, nav: point.nav });
          }
        }
      }
      validPoints.sort((a, b) => a.time - b.time);
      if (validPoints.length === 0) {
        return {
          label: dataset.label,
          color: dataset.color,
          valueMap: new Map<string, number>(),
        };
      }
      const startingNav = validPoints[0].nav;
      const valueMap = new Map<string, number>();
      if (dataMode === 'value') {
        for (const pt of validPoints) {
          valueMap.set(pt.date, pt.nav);
        }
      } else if (Number.isFinite(startingNav) && startingNav > 0) {
        const factor = initialInvestment / startingNav;
        for (const pt of validPoints) {
          valueMap.set(pt.date, Number((pt.nav * factor).toFixed(2)));
        }
      }
      return {
        label: dataset.label,
        color: dataset.color,
        valueMap,
      };
    });
    const chartData = activeDates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (let i = 0; i < normalizedDatasets.length; i++) {
        row[`fund_${i}`] = normalizedDatasets[i].valueMap.get(date) ?? NaN;
      }
      return row;
    });
    const series = normalizedDatasets.map((dataset, index) => ({
      type: 'line' as const,
      xKey: 'date',
      xName: 'Date',
      yKey: `fund_${index}`,
      yName: dataset.label,
      stroke: dataset.color,
      marker: {
        enabled: false,
      },
      tooltip: {
        showArrow: false,
        renderer: ({ datum }: { datum: Record<string, string | number> }) => {
          const value = datum[`fund_${index}`];
          return {
            title: dataset.label,
            data: [
              {
                label: 'Value',
                value:
                  typeof value === 'number' && Number.isFinite(value)
                    ? formatCurrency(value)
                    : 'N/A',
              },
            ],
          };
        },
      },
    }));
    const isAutoHeight = autoHeight || height === 'auto';
    return {
      background: {
        visible: false,
      },
      data: chartData,
      ...(isAutoHeight
        ? { minHeight }
        : { height: typeof height === 'number' ? height : 240 }),
      legend: {
        enabled: false,
        position: 'bottom',
        toggleSeries: false,
      },
      series,
      axes: {
        x: {
          type: 'category',
          position: 'bottom',
          label: {
            enabled: false,
            rotation: 0,
            avoidCollisions: true,
            fontSize: 9,
            fontWeight: 'bold',
          },
        },
        y: {
          type: 'number',
          position: 'left',
          label: {
            avoidCollisions: true,
            fontSize: 9,
            fontWeight: 'bold',
            formatter: ({ value }: { value: number }) => formatAxisCurrency(value),
          },
        },
      },
    };
  }, [datasets, initialInvestment, dataMode, height, autoHeight, minHeight, activeDates]);
  const hasAnyData = datasets.some((d) => d.data && d.data.length > 0);
  if (isLoading || (datasets.length > 0 && !hasAnyData)) {
    return (
      <div className={`${className} ${styles.emptyContainer}`}>
        <Spinner size="md" label={loadingLabel || 'Loading historical NAV data...'} />
      </div>
    );
  }
  if (datasets.length === 0) {
    return (
      <div className={`${className} ${styles.emptyContainer}`}>
        <span className={styles.emptyText}>{emptyMessage || 'Select a mutual fund to view trajectory'}</span>
      </div>
    );
  }
  if (allSortedDates.length === 0) {
    return (
      <div className={`${className} ${styles.emptyContainer}`}>
        <span className={styles.emptyText}>No NAV history found for the selected dates</span>
      </div>
    );
  }
  if (initialInvestment <= 0) {
    return (
      <div className={`${className} ${styles.emptyContainer}`}>
        <span className={styles.emptyText}>Enter an investment amount to view growth</span>
      </div>
    );
  }
  if (!chartOptions) {
    return (
      <div className={`${className} ${styles.emptyContainer}`}>
        <Spinner size="sm" label="Preparing chart..." />
      </div>
    );
  }
  if (!mounted) {
    return (
      <div className={`${className} ${styles.emptyContainer}`}>
        <Spinner size="sm" label="Loading chart..." />
      </div>
    );
  }
  return (
    <div className={`${className} ${styles.chartWrapper}`}>
      {enableZoom && allSortedDates.length > 5 && (showPresets || zoomRange) && (
        <div className={styles.zoomToolbar}>
          {showPresets && (
            <div className={styles.zoomPresets}>
              {['1M', '6M', '1Y', '3Y', '5Y', 'All'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className={`${styles.zoomPresetBtn} ${activePreset === preset ? styles.activePreset : ''}`}
                  onClick={() => handleApplyPreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
          <div className={styles.zoomInfo}>
            {zoomRange ? (
              <>
                <span className={styles.zoomBadge}>
                  {zoomRange.start} → {zoomRange.end}
                </span>
                <button
                  type="button"
                  className={styles.resetZoomBtn}
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                >
                  ↩ Reset
                </button>
              </>
            ) : (
              <span className={styles.zoomHint}>Drag horizontally to zoom into a section</span>
            )}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className={styles.chartContainer}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {dragState?.isDragging && (
          <div
            className={styles.zoomSelectionOverlay}
            style={{
              left: Math.min(dragState.startX, dragState.currentX),
              width: Math.abs(dragState.currentX - dragState.startX),
            }}
          />
        )}
        <AgCharts className={styles.chart} options={chartOptions} />
      </div>
    </div>
  );
};
export default Chart;
