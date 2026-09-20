import React, { useMemo } from 'react';
import { FundStageMetrics } from './types';
import styles from './StrategyCalculator.module.scss';
interface StageGraphProps {
  trajectoryPoints: Array<{ month: number; date: string; value: number; cost: number }>;
  fundMetrics: FundStageMetrics[];
}
export const StageGraph: React.FC<StageGraphProps> = ({ trajectoryPoints, fundMetrics }) => {
  const { pathD, areaD, minVal, maxVal, lastVal } = useMemo(() => {
    if (!trajectoryPoints || trajectoryPoints.length === 0) {
      return { pathD: '', areaD: '', minVal: 0, maxVal: 0, lastVal: 0 };
    }
    const values = trajectoryPoints.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const width = 320;
    const height = 75;
    const padding = 6;
    const coords = trajectoryPoints.map((p, idx) => {
      const x = padding + (idx / Math.max(1, trajectoryPoints.length - 1)) * (width - padding * 2);
      const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    });
    if (coords.length === 1) {
      const single = coords[0];
      return {
        pathD: `M ${single.x - 10} ${single.y} L ${single.x + 10} ${single.y}`,
        areaD: `M ${single.x - 10} ${single.y} L ${single.x + 10} ${single.y} L ${single.x + 10} ${height} L ${single.x - 10} ${height} Z`,
        minVal: min,
        maxVal: max,
        lastVal: values[0],
      };
    }
    const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const first = coords[0];
    const last = coords[coords.length - 1];
    const fillPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;
    return {
      pathD: linePath,
      areaD: fillPath,
      minVal: min,
      maxVal: max,
      lastVal: values[values.length - 1],
    };
  }, [trajectoryPoints]);
  const totalFundVal = fundMetrics.reduce((sum, f) => sum + f.currentValue, 0) || 1;
  return (
    <div className={styles.stageGraphContainer}>
      <div className={styles.stageGraphHeader}>
        <span className={styles.graphTitle}>Stage Trajectory &amp; Asset Allocation</span>
        <div className={styles.graphMetrics}>
          <span className={styles.graphCurVal}>Trajectory Value: ₹{lastVal.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div className={styles.sparklineCard}>
        <svg viewBox="0 0 320 75" className={styles.sparklineSvg} preserveAspectRatio="none">
          <defs>
            <linearGradient id="stageAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7b1fa2" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#7b1fa2" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {areaD && <path d={areaD} fill="url(#stageAreaGrad)" />}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#7b1fa2"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        <div className={styles.sparklineLabels}>
          <span>Min: ₹{minVal.toLocaleString('en-IN')}</span>
          <span>{trajectoryPoints.length} Months Trajectory</span>
          <span>Peak: ₹{maxVal.toLocaleString('en-IN')}</span>
        </div>
      </div>
      <div className={styles.stageAllocRow}>
        <div className={styles.allocBarStacked}>
          {fundMetrics.map((f, idx) => {
            const pct = Math.round((f.currentValue / totalFundVal) * 100);
            return (
              <div
                key={f.schemeCode}
                className={styles.allocSegment}
                data-fund-index={idx % 4}
                title={`${f.schemeName}: ${pct}% (₹${f.currentValue.toLocaleString('en-IN')})`}
              >
                {pct >= 15 && `${pct}%`}
              </div>
            );
          })}
        </div>
        <div className={styles.allocLegend}>
          {fundMetrics.map((f, idx) => {
            const pct = Math.round((f.currentValue / totalFundVal) * 100);
            return (
              <span key={f.schemeCode} className={styles.legendPill}>
                <span className={styles.legendColorDot} data-fund-index={idx % 4} />
                <span className={styles.legendName}>{f.schemeName.slice(0, 16)}... ({pct}%)</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
