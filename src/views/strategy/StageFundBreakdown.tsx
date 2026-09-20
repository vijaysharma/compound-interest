import React from 'react';
import { FundStageMetrics } from './types';
import styles from './StrategyCalculator.module.scss';
interface StageFundBreakdownProps {
  fundMetrics: FundStageMetrics[];
}
export const StageFundBreakdown: React.FC<StageFundBreakdownProps> = ({ fundMetrics }) => {
  return (
    <div className={styles.stageFundBreakdown}>
      <div className={styles.sectionSubhead}>
        <span className={styles.subheadTitle}>Per-Fund Valuation &amp; Return Breakdown</span>
        <span className={styles.subheadNote}>Unit holdings, CAGR &amp; net cash flows</span>
      </div>
      <div className={styles.fundTableWrapper}>
        <table className={styles.fundMetricsTable}>
          <thead>
            <tr>
              <th>Fund Name</th>
              <th>Alloc Units</th>
              <th>NAV (₹)</th>
              <th>Current Val (₹)</th>
              <th>Abs Return (₹)</th>
              <th>CAGR</th>
              <th>Cashflow (In / Out)</th>
            </tr>
          </thead>
          <tbody>
            {fundMetrics.map((fm) => {
              const isProfit = fm.absoluteReturn >= 0;
              return (
                <tr key={fm.schemeCode}>
                  <td className={styles.fundNameCell}>
                    <div className={styles.fundNameText}>{fm.schemeName}</div>
                    <span className={fm.fundType === 'equity' ? styles.tagEquity : styles.tagDebt}>
                      {fm.fundType.toUpperCase()} ({fm.allocationPercent}%)
                    </span>
                  </td>
                  <td className={styles.numericCell}>{fm.units.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  <td className={styles.numericCell}>₹{fm.currentNav.toFixed(2)}</td>
                  <td className={styles.numericCellBold}>₹{fm.currentValue.toLocaleString('en-IN')}</td>
                  <td className={`${styles.numericCell} ${isProfit ? styles.positiveGain : styles.negativeGain}`}>
                    {isProfit ? '+' : ''}₹{fm.absoluteReturn.toLocaleString('en-IN')}
                  </td>
                  <td className={styles.numericCellBold}>{fm.cagr.toFixed(1)}%</td>
                  <td className={styles.cashFlowCell}>
                    <span className={styles.cashIn}>+₹{fm.cashFlowIn.toLocaleString('en-IN')}</span>
                    {fm.cashFlowOut > 0 && (
                      <span className={styles.cashOut}>-₹{fm.cashFlowOut.toLocaleString('en-IN')}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
