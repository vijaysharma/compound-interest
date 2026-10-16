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
}
export const CurrencyHistoryChart: React.FC<CurrencyHistoryChartProps> = ({
  sourceCurrency,
  targetCurrency,
  points,
  loading,
}) => {
  if (loading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>
            30-Day Rate History ({sourceCurrency.code} → {targetCurrency.code})
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
            30-Day Rate History ({sourceCurrency.code} → {targetCurrency.code})
          </h3>
        </div>
        <div className={styles.chartEmpty}>
          <span>No historical rate trajectory available for this currency pair.</span>
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
            30-Day Rate Trajectory ({sourceCurrency.code} → {targetCurrency.code})
          </h3>
          <span className={styles.chartSubTitle}>
            Daily interbank closing rates over the past 30 days
          </span>
        </div>
        <div className={`${styles.changeBadge} ${isPositive ? styles.changePos : styles.changeNeg}`}>
          {isPositive ? '+' : ''}
          {changePercent.toFixed(2)}%
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
