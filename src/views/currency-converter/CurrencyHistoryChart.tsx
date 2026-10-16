'use client';
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { CurrencyHistoricalPoint } from '@/actions/data';
import type { CountryCurrencyInfo } from './currencyDataUtils';
import styles from '../CurrencyConverter.module.scss';
interface CurrencyHistoryChartProps {
  sourceCurrency: CountryCurrencyInfo;
  targetCurrency: CountryCurrencyInfo;
  points: CurrencyHistoricalPoint[];
  loading: boolean;
  graphPreset?: '7D' | '1M' | '3M' | '6M' | '1Y' | 'custom';
  graphStartDate?: string;
  graphEndDate?: string;
  onSelectGraphPreset?: (preset: '7D' | '1M' | '3M' | '6M' | '1Y') => void;
  onCustomGraphDates?: (start: string, end: string) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
}
export const CurrencyHistoryChart: React.FC<CurrencyHistoryChartProps> = ({
  sourceCurrency,
  targetCurrency,
  points,
  loading,
  graphPreset = '1M',
  graphStartDate,
  graphEndDate,
  onSelectGraphPreset,
  onCustomGraphDates,
  selectedDate,
  onSelectDate,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const rangeTitle = graphPreset === 'custom'
    ? `${graphStartDate} to ${graphEndDate}`
    : `${graphPreset} Rate Trajectory`;
  if (loading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            {rangeTitle} ({sourceCurrency.code} → {targetCurrency.code})
          </h3>
        </div>
        <div className={styles.chartEmpty}>
          <span>Loading historical exchange rates...</span>
        </div>
      </div>
    );
  }
  if (!points || points.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            {rangeTitle} ({sourceCurrency.code} → {targetCurrency.code})
          </h3>
        </div>
        <div className={styles.chartControlsRow}>
          <div className={styles.presetGroup}>
            {(['7D', '1M', '3M', '6M', '1Y'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSelectGraphPreset?.(p)}
                className={`${styles.presetBtn} ${graphPreset === p ? styles.active : ''}`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className={styles.customDatesRow}>
            <label htmlFor="graph-start-date-empty">From:</label>
            <input
              id="graph-start-date-empty"
              type="date"
              value={graphStartDate || ''}
              max={graphEndDate || todayIso}
              onChange={(e) => onCustomGraphDates?.(e.target.value, graphEndDate || todayIso)}
              className={styles.customDateInput}
              aria-label="Start date"
            />
            <label htmlFor="graph-end-date-empty">To:</label>
            <input
              id="graph-end-date-empty"
              type="date"
              value={graphEndDate || ''}
              max={todayIso}
              min={graphStartDate || '1999-01-04'}
              onChange={(e) => onCustomGraphDates?.(graphStartDate || '', e.target.value)}
              className={styles.customDateInput}
              aria-label="End date"
            />
          </div>
        </div>
        <div className={styles.chartEmpty}>
          <span>No historical rate trajectory available for this range or currency pair.</span>
        </div>
      </div>
    );
  }
  const rates = points.map((p) => p.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const padding = (maxRate - minRate) * 0.1 || minRate * 0.01;
  const domainMin = Math.max(0, parseFloat((minRate - padding).toFixed(4)));
  const domainMax = parseFloat((maxRate + padding).toFixed(4));
  const firstRate = points[0].rate;
  const lastRate = points[points.length - 1].rate;
  const changePercent = firstRate > 0 ? ((lastRate - firstRate) / firstRate) * 100 : 0;
  const isPositive = changePercent >= 0;
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <h3 className={styles.chartTitle}>
            {rangeTitle} ({sourceCurrency.code} → {targetCurrency.code})
          </h3>
          <span className={styles.chartSubTitle}>
            Daily closing rates ({points.length} data points). Click any point to convert on that date.
            {selectedDate ? ` (Active date: ${selectedDate})` : ''}
          </span>
        </div>
        <div className={`${styles.changeBadge} ${isPositive ? styles.changePos : styles.changeNeg}`}>
          {isPositive ? '+' : ''}
          {changePercent.toFixed(2)}%
        </div>
      </div>
      <div className={styles.chartControlsRow}>
        <div className={styles.presetGroup}>
          {(['7D', '1M', '3M', '6M', '1Y'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSelectGraphPreset?.(p)}
              className={`${styles.presetBtn} ${graphPreset === p ? styles.active : ''}`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className={styles.customDatesRow}>
          <label htmlFor="graph-start-date">From:</label>
          <input
            id="graph-start-date"
            type="date"
            value={graphStartDate || ''}
            max={graphEndDate || todayIso}
            onChange={(e) => onCustomGraphDates?.(e.target.value, graphEndDate || todayIso)}
            className={styles.customDateInput}
            aria-label="Start date"
          />
          <label htmlFor="graph-end-date">To:</label>
          <input
            id="graph-end-date"
            type="date"
            value={graphEndDate || ''}
            max={todayIso}
            min={graphStartDate || '1999-01-04'}
            onChange={(e) => onCustomGraphDates?.(graphStartDate || '', e.target.value)}
            className={styles.customDateInput}
            aria-label="End date"
          />
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={points}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            onClick={(state) => {
              const payloadState = state as unknown as { activePayload?: Array<{ payload?: { date?: string } }>; activeLabel?: string };
              const clickedDate = payloadState?.activePayload?.[0]?.payload?.date || payloadState?.activeLabel;
              if (clickedDate && onSelectDate) {
                onSelectDate(clickedDate);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              tickFormatter={(d: string) => {
                const parts = d.split('-');
                return parts.length >= 3 ? `${parts[2]}/${parts[1]}` : d;
              }}
              minTickGap={20}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              domain={[domainMin, domainMax]}
              tickFormatter={(v: number) => v.toFixed(v >= 10 ? 2 : 4)}
              width={55}
            />
            <Tooltip
              formatter={(value: unknown) => [
                typeof value === 'number' ? value.toFixed(4) : String(value ?? ''),
                `1 ${sourceCurrency.code}`,
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--color-heading)',
              }}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="var(--color-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, stroke: 'var(--color-primary)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
