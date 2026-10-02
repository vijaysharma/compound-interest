'use client';
import React, { useMemo, useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  useActiveTooltipDataPoints,
} from 'recharts';
import { FiBarChart2, FiChevronDown, FiTrendingUp } from 'react-icons/fi';
import type {
  ProcessedFIIDIIPoint,
  AdjustmentMode,
  ViewMode,
  Timeframe,
  FlowInterval,
} from '@/lib/fiiDii/fiiDiiCalculations';
import { FLOW_INTERVALS, isIntervalAllowedForTimeframe } from '@/lib/fiiDii/fiiDiiCalculations';
import styles from './FiiDiiTracker.module.scss';
export type ChartType = 'bar' | 'line';
const QUICK_TFS: Timeframe[] = ['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'];
// Reads the hovered/touched bucket straight from the chart's tooltip state (mouse and
// touch alike) so the details strip below the chart tracks the crosshair exactly.
const ActivePointReporter = ({
  onChange,
}: {
  onChange: (point: ProcessedFIIDIIPoint | null) => void;
}) => {
  const point = useActiveTooltipDataPoints<ProcessedFIIDIIPoint>()?.[0] ?? null;
  useEffect(() => {
    onChange(point);
  }, [point, onChange]);
  return null;
};
interface FiiDiiChartProps {
  points: ProcessedFIIDIIPoint[];
  adjustmentMode: AdjustmentMode;
  viewMode: ViewMode;
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  timeframe: Timeframe;
  onTimeframeChange: (t: Timeframe) => void;
  interval: FlowInterval;
  onIntervalChange: (i: FlowInterval) => void;
  showFii: boolean;
  showDii: boolean;
  showNifty: boolean;
  showSensex: boolean;
  isLoading?: boolean;
}
export const FiiDiiChart: React.FC<FiiDiiChartProps> = ({
  points,
  adjustmentMode,
  viewMode,
  chartType,
  onChartTypeChange,
  timeframe,
  onTimeframeChange,
  interval,
  onIntervalChange,
  showFii,
  showDii,
  showNifty,
  showSensex,
  isLoading,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [activeHoverPoint, setActiveHoverPoint] = useState<ProcessedFIIDIIPoint | null>(null);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Format Left Y-Axis ticks
  const formatLeftAxisTick = (val: number) => {
    if (val === 0) return '0';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (adjustmentMode === 'ppp') {
      if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}B`;
      return `${sign}$${abs.toFixed(0)}M`;
    }
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L Cr`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(0)}k Cr`;
    return `${sign}₹${abs.toFixed(0)} Cr`;
  };
  // Format Right Y-Axis ticks (Index levels)
  const formatRightAxisTick = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
    return val.toLocaleString();
  };
  // Calculate dynamic Right Y-Axis domain for Index lines
  const rightAxisDomain = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const p of points) {
      if (showNifty && p.niftyClose && p.niftyClose > 0) {
        if (p.niftyClose < min) min = p.niftyClose;
        if (p.niftyClose > max) max = p.niftyClose;
      }
      if (showSensex && p.sensexClose && p.sensexClose > 0) {
        if (p.sensexClose < min) min = p.sensexClose;
        if (p.sensexClose > max) max = p.sensexClose;
      }
    }
    if (min === Infinity || max === -Infinity) {
      return ['auto', 'auto'];
    }
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [points, showNifty, showSensex]);
  // Downsample data if large (>400 points) to keep mobile rendering smooth
  const chartData = useMemo(() => {
    if (points.length <= 400) return points;
    const step = Math.ceil(points.length / 300);
    const sampled: ProcessedFIIDIIPoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      sampled.push(points[i]);
    }
    // Always include the latest point
    if (sampled[sampled.length - 1] !== points[points.length - 1]) {
      sampled.push(points[points.length - 1]);
    }
    return sampled;
  }, [points]);
  const fyOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const opts: { value: Timeframe; label: string }[] = [];
    for (let y = currentYear + 1; y >= 2008; y--) {
      opts.push({
        value: `FY${y}` as Timeframe,
        label: `FY${y - 1}–${String(y).slice(2)} (Apr–Mar)`,
      });
    }
    return opts;
  }, []);
  // Default active point to the latest point if none hovered
  const displayedPoint =
    activeHoverPoint || (chartData.length > 0 ? chartData[chartData.length - 1] : null);
  if (isLoading) {
    return (
      <div className={styles.chartPlaceholder}>
        <div className={styles.spinner} />
        <p>Crunching institutional flow data & index movements...</p>
      </div>
    );
  }
  if (points.length === 0) {
    return (
      <div className={styles.chartPlaceholder}>
        <p>No institutional flow records found for the selected timeframe.</p>
      </div>
    );
  }
  const isCumulative = viewMode === 'cumulative';
  const hasRightAxis = showNifty || showSensex;
  const isLineMode = chartType === 'line' || isCumulative;
  const unitLabel =
    adjustmentMode === 'ppp' ? '$M (PPP)' : adjustmentMode === 'inflation' ? '₹ Cr (Real)' : '₹ Cr';
  const formatAmount = (num: number) => {
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${num.toLocaleString('en-IN', { maximumFractionDigits: 1 })}`;
  };
  const currentFiiVal = displayedPoint
    ? isCumulative
      ? displayedPoint.cumulativeFiiNet
      : displayedPoint.fiiNet
    : 0;
  const currentDiiVal = displayedPoint
    ? isCumulative
      ? displayedPoint.cumulativeDiiNet
      : displayedPoint.diiNet
    : 0;
  const isFyActive = typeof timeframe === 'string' && timeframe.startsWith('FY');
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitleGroup}>
          <div className={styles.chartMainTitleRow}>
            <h3 className={styles.chartMainTitle}>
              {isCumulative ? 'Cumulative Net Institutional Flow' : 'Net Institutional Flow'}
            </h3>
            {/* Chart Type Toggle [ Bar ] | [ Line ] */}
            <div
              className={styles.chartTypeControl}
              role="group"
              aria-label="Chart representation mode"
            >
              <button
                type="button"
                className={`${styles.chartTypeBtn} ${chartType === 'bar' ? styles.chartTypeBtnActive : ''}`}
                onClick={() => onChartTypeChange('bar')}
                title="View as Bar Chart"
                aria-pressed={chartType === 'bar'}
              >
                <FiBarChart2 size={13} />
                <span>Bar</span>
              </button>
              <button
                type="button"
                className={`${styles.chartTypeBtn} ${chartType === 'line' ? styles.chartTypeBtnActive : ''}`}
                onClick={() => onChartTypeChange('line')}
                title="View as Line Chart"
                aria-pressed={chartType === 'line'}
              >
                <FiTrendingUp size={13} />
                <span>Line</span>
              </button>
            </div>
          </div>
          <span className={styles.chartSubTitle}>
            {adjustmentMode === 'nominal'
              ? 'Values in ₹ Crores (Nominal)'
              : adjustmentMode === 'inflation'
                ? 'Inflation Adjusted (Base: Latest CPI)'
                : 'Purchasing Power Parity Adjusted (in $ Million)'}
            {hasRightAxis && ' • Dual Axis with Stock Index Overlay'}
          </span>
        </div>
        {/* Time Interval & Duration Controls placed directly at the top of the graph */}
        <div className={styles.chartControlsRow}>
          {/* 1. Time Interval Chips */}
          <div
            className={styles.chartControlGroup}
            role="group"
            aria-label="Select data aggregation interval"
          >
            <span className={styles.chartControlLabel}>Interval:</span>
            <div className={styles.chartIntervalChips}>
              {FLOW_INTERVALS.map((item) => {
                const isAllowed = isIntervalAllowedForTimeframe(item.key, timeframe);
                const abbrMap: Record<FlowInterval, string> = {
                  daily: 'Daily',
                  weekly: 'Wk',
                  monthly: 'Mo',
                  quarterly: 'Qtr',
                  halfyearly: '6M',
                  yearly: 'Yr',
                };
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${styles.chartIntervalChip} ${interval === item.key ? styles.chartIntervalChipActive : ''}`}
                    onClick={() => onIntervalChange(item.key)}
                    disabled={isLoading || !isAllowed}
                    title={
                      !isAllowed
                        ? `Interval '${item.label}' is longer than the selected duration (${timeframe})`
                        : `Group flows by ${item.label}`
                    }
                  >
                    <span className={styles.chipTextFull}>{item.label}</span>
                    <span className={styles.chipTextAbbr}>{abbrMap[item.key]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* 2. Duration Chips */}
          <div
            className={styles.chartControlGroup}
            role="group"
            aria-label="Select duration timeframe"
          >
            <span className={styles.chartControlLabel}>Duration:</span>
            <div className={styles.chartTimeframeChips}>
              {QUICK_TFS.map((tf) => {
                const isActive = timeframe === tf || (tf === 'ALL' && timeframe === 'MAX');
                return (
                  <button
                    key={tf}
                    type="button"
                    className={`${styles.chartTfChip} ${isActive ? styles.chartTfChipActive : ''}`}
                    onClick={() => onTimeframeChange(tf)}
                    disabled={isLoading}
                    title={`View past ${tf}`}
                  >
                    {tf}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 3. FY Dropdown on dedicated row on mobile / responsive wrap */}
          <div className={styles.fyDropdownRow}>
            <span className={styles.fyRowLabel}>Financial Year:</span>
            {/* Native select stays transparent on top (16px, so iOS won't zoom on focus);
                the visible label underneath uses the chip type scale. */}
            <div className={`${styles.fyDropdownWrap} ${isFyActive ? styles.fySelectActive : ''}`}>
              <span className={styles.fySelectLabel} aria-hidden="true">
                {fyOptions.find((opt) => opt.value === timeframe)?.label ?? 'Select FY (Apr–Mar)'}
              </span>
              <FiChevronDown size={12} aria-hidden="true" />
              <select
                className={styles.fySelect}
                value={isFyActive ? String(timeframe) : ''}
                onChange={(e) => {
                  if (e.target.value) onTimeframeChange(e.target.value as Timeframe);
                }}
                disabled={isLoading}
                aria-label="Select Financial Year"
              >
                <option value="">Select Indian FY (Apr–Mar)</option>
                {fyOptions.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={
              isMobile
                ? { top: 10, right: hasRightAxis ? 4 : 0, left: -4, bottom: 4 }
                : { top: 12, right: hasRightAxis ? 12 : 6, left: -10, bottom: 6 }
            }
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.2)"
              vertical={false}
            />
            <XAxis
              dataKey="formattedDate"
              stroke="#94a3b8"
              fontSize={isMobile ? 10 : 11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              interval="preserveStartEnd"
              minTickGap={isMobile ? 36 : 28}
            />
            {/* Left Y-Axis: FII / DII Flows */}
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              fontSize={isMobile ? 10 : 11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
              tickFormatter={formatLeftAxisTick}
              width={isMobile ? 54 : 68}
            />
            {/* Right Y-Axis: Stock Indices (Nifty 50 / Sensex) */}
            {hasRightAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                fontSize={isMobile ? 10 : 11}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
                domain={rightAxisDomain}
                tickFormatter={formatRightAxisTick}
                width={isMobile ? 42 : 52}
              />
            )}
            <ReferenceLine y={0} yAxisId="left" stroke="#cbd5e1" strokeDasharray="4 4" />
            <ActivePointReporter onChange={setActiveHoverPoint} />
            <Tooltip
              content={() => null}
              cursor={{ stroke: 'rgba(99, 102, 241, 0.35)', strokeWidth: 1.5 }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: 10, fontSize: '0.8rem' }}
            />
            {/* Flow Data: Toggled between Bar and Line representations */}
            {isLineMode ? (
              <>
                {showFii && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={isCumulative ? 'cumulativeFiiNet' : 'fiiNet'}
                    name={isCumulative ? 'FII Net (Cumulative)' : 'FII Net'}
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#1d4ed8', strokeWidth: 2 }}
                  />
                )}
                {showDii && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={isCumulative ? 'cumulativeDiiNet' : 'diiNet'}
                    name={isCumulative ? 'DII Net (Cumulative)' : 'DII Net'}
                    stroke="#059669"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#047857', strokeWidth: 2 }}
                  />
                )}
              </>
            ) : (
              <>
                {showFii && (
                  <Bar
                    yAxisId="left"
                    dataKey="fiiNet"
                    name="FII Net"
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={14}
                  />
                )}
                {showDii && (
                  <Bar
                    yAxisId="left"
                    dataKey="diiNet"
                    name="DII Net"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={14}
                  />
                )}
              </>
            )}
            {/* Right Y-Axis Index Overlays */}
            {showNifty && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="niftyClose"
                name="Nifty 50"
                stroke="#8b5cf6"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                activeDot={{ r: 4, stroke: '#7c3aed', strokeWidth: 2 }}
              />
            )}
            {showSensex && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sensexClose"
                name="BSE Sensex"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 4, stroke: '#ea580c', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Popover / Point Details placed cleanly below the chart so canvas is never obscured */}
      <div className={styles.chartHoverInfo} aria-live="polite">
        {displayedPoint ? (
          <>
            <div className={styles.chartHoverHeader}>
              <span className={styles.chartHoverDate}>{displayedPoint.formattedDate}</span>
              <span className={styles.tooltipModeBadge}>{adjustmentMode.toUpperCase()}</span>
              {activeHoverPoint ? (
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>(Hovered)</span>
              ) : (
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>(Latest Session)</span>
              )}
            </div>
            <div className={styles.chartHoverStats}>
              {showFii && (
                <div className={styles.chartHoverItem}>
                  <span className={`${styles.legendDot} ${styles.dotFii}`} />
                  <span className={styles.chartHoverLabel}>FII Net:</span>
                  <span
                    className={`${styles.chartHoverVal} ${currentFiiVal >= 0 ? styles.pos : styles.neg}`}
                  >
                    {formatAmount(currentFiiVal)} {unitLabel}
                  </span>
                </div>
              )}
              {showDii && (
                <div className={styles.chartHoverItem}>
                  <span className={`${styles.legendDot} ${styles.dotDii}`} />
                  <span className={styles.chartHoverLabel}>DII Net:</span>
                  <span
                    className={`${styles.chartHoverVal} ${currentDiiVal >= 0 ? styles.pos : styles.neg}`}
                  >
                    {formatAmount(currentDiiVal)} {unitLabel}
                  </span>
                </div>
              )}
              {showNifty && displayedPoint.niftyClose && (
                <div className={styles.chartHoverItem}>
                  <span className={`${styles.legendDot} ${styles.dotNifty}`} />
                  <span className={styles.chartHoverLabel}>Nifty 50:</span>
                  <span className={styles.chartHoverVal}>
                    {displayedPoint.niftyClose.toLocaleString('en-IN', {
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
              )}
              {showSensex && displayedPoint.sensexClose && (
                <div className={styles.chartHoverItem}>
                  <span className={`${styles.legendDot} ${styles.dotSensex}`} />
                  <span className={styles.chartHoverLabel}>Sensex:</span>
                  <span className={styles.chartHoverVal}>
                    {displayedPoint.sensexClose.toLocaleString('en-IN', {
                      maximumFractionDigits: 1,
                    })}
                  </span>
                </div>
              )}
              {adjustmentMode === 'inflation' && displayedPoint.cpi && (
                <div className={styles.chartHoverItem}>
                  <span className={styles.chartHoverLabel}>CPI:</span>
                  <span className={styles.chartHoverVal}>{displayedPoint.cpi}</span>
                </div>
              )}
              {adjustmentMode === 'ppp' && displayedPoint.ppp && (
                <div className={styles.chartHoverItem}>
                  <span className={styles.chartHoverLabel}>PPP:</span>
                  <span className={styles.chartHoverVal}>₹{displayedPoint.ppp}/$</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <span className={styles.chartHoverEmpty}>
            Hover over any bar or point to inspect exact flows.
          </span>
        )}
      </div>
    </div>
  );
};
