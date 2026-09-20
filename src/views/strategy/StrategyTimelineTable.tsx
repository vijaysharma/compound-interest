import React, { useState } from 'react';
import { TimelineStage } from './types';
import styles from './StrategyCalculator.module.scss';
interface StrategyTimelineTableProps {
  stages: TimelineStage[];
}
export const StrategyTimelineTable: React.FC<StrategyTimelineTableProps> = ({ stages }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'annual' | 'withdrawals'>('annual');
  const filteredStages = stages.filter((s) => {
    if (filterMode === 'annual') return s.monthIndex % 12 === 0 || s.monthIndex === 1 || s.monthIndex === stages.length;
    if (filterMode === 'withdrawals') return s.swpGrossWithdrawn > 0;
    return true;
  });
  const formatInr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  return (
    <div className={styles.timelineTableCard}>
      <div className={styles.tableHeaderBar}>
        <div>
          <h3 className={styles.tableTitle}>Continuous Stage-by-Stage Ledger (&ldquo;This Continues&rdquo;)</h3>
          <span className={styles.tableSubtitle}>Granular audit of balance, redemptions, taxes, and reinvestments</span>
        </div>
        <div className={styles.filterButtonGroup}>
          <button
            type="button"
            className={`${styles.tableFilterBtn} ${filterMode === 'annual' ? styles.activeFilterBtn : ''}`}
            onClick={() => setFilterMode('annual')}
          >
            Annual Milestones
          </button>
          <button
            type="button"
            className={`${styles.tableFilterBtn} ${filterMode === 'withdrawals' ? styles.activeFilterBtn : ''}`}
            onClick={() => setFilterMode('withdrawals')}
          >
            SWP Withdrawals
          </button>
          <button
            type="button"
            className={`${styles.tableFilterBtn} ${filterMode === 'all' ? styles.activeFilterBtn : ''}`}
            onClick={() => setFilterMode('all')}
          >
            All {stages.length} Months
          </button>
        </div>
      </div>
      <div className={styles.tableScrollWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Month</th>
              <th>Date</th>
              <th>Event</th>
              <th>Source Bal</th>
              <th>Top-Up</th>
              <th>Gross SWP</th>
              <th>STCG</th>
              <th>LTCG</th>
              <th>Tax Deducted</th>
              <th>Net Cash / SIP</th>
              <th>SIP Bal</th>
              <th>Combined Wealth</th>
            </tr>
          </thead>
          <tbody>
            {filteredStages.map((s) => (
              <tr key={s.monthIndex} className={s.monthIndex % 12 === 0 ? styles.annualRow : ''}>
                <td>M{s.monthIndex}</td>
                <td className={styles.dateCell}>{s.date}</td>
                <td><span className={styles.eventBadge}>{s.eventDescription}</span></td>
                <td className={styles.numCell}>{formatInr(s.sourceClosingBalance)}</td>
                <td className={styles.numCell}>{s.topUpAdded > 0 ? `+${formatInr(s.topUpAdded)}` : '-'}</td>
                <td className={styles.numCellHighlight}>{s.swpGrossWithdrawn > 0 ? formatInr(s.swpGrossWithdrawn) : '-'}</td>
                <td className={styles.numCell}>{s.stcgGains > 0 ? formatInr(s.stcgGains) : '-'}</td>
                <td className={styles.numCell}>{s.ltcgGains > 0 ? formatInr(s.ltcgGains) : '-'}</td>
                <td className={styles.numCellDanger}>{s.taxPayable > 0 ? formatInr(s.taxPayable) : '₹0'}</td>
                <td className={styles.numCellSuccess}>{s.swpNetReceived > 0 ? formatInr(s.swpNetReceived) : '-'}</td>
                <td className={styles.numCell}>{formatInr(s.sipClosingBalance)}</td>
                <td className={styles.numCellBold}>{formatInr(s.combinedNetWorth)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
