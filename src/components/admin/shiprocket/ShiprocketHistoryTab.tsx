'use client';
import React from 'react';
import { FiRefreshCw, FiClock } from 'react-icons/fi';
import type { ShiprocketStatementItem } from './types';
import styles from '../ShiprocketDashboard.module.scss';
export interface ShiprocketHistoryTabProps {
  statement: ShiprocketStatementItem[];
  loadingStatement: boolean;
  onRefreshStatement: () => void;
}
export const ShiprocketHistoryTab: React.FC<ShiprocketHistoryTabProps> = React.memo(
  ({ statement, loadingStatement, onRefreshStatement }) => (
    <>
      <div className={styles.sectionHeaderRow}>
        <h3 className={styles.sectionHeading}>
          Wallet Ledger & Transaction History
        </h3>
        <button
          className={styles.outlineBtn}
          onClick={onRefreshStatement}
          disabled={loadingStatement}
        >
          <FiRefreshCw className={loadingStatement ? styles.spinner : ''} /> Refresh Ledger
        </button>
      </div>
      {loadingStatement ? (
        <div className={styles.emptyState}>
          <span className={styles.spinner} />
          <p className={styles.emptyDesc}>Loading wallet statement...</p>
        </div>
      ) : statement.length === 0 ? (
        <div className={styles.emptyState}>
          <FiClock className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No transaction history found</h3>
          <p className={styles.emptyDesc}>
            No wallet transactions or ledger records have been recorded yet.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description / Action</th>
                <th>Order / AWB</th>
                <th>Weight</th>
                <th>Debit (₹)</th>
                <th>Credit (₹)</th>
                <th>Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {statement.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.date || item.created_at || '—'}</td>
                  <td>
                    <strong>{item.description || item.action || 'Transaction'}</strong>
                  </td>
                  <td>
                    {item.order_id || item.awb_code ? (
                      <div>
                        {item.order_id && <span>Order: #{item.order_id} </span>}
                        {item.awb_code && <span>AWB: {item.awb_code}</span>}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{item.charged_weight || item.applied_weight || '—'}</td>
                  <td className={item.debit_amount ? styles.debitVal : ''}>
                    {item.debit_amount ? `-₹${item.debit_amount}` : '—'}
                  </td>
                  <td className={item.credit_amount ? styles.creditVal : ''}>
                    {item.credit_amount ? `+₹${item.credit_amount}` : '—'}
                  </td>
                  <td>
                    <strong>₹{item.balance_amount || '—'}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
);
ShiprocketHistoryTab.displayName = 'ShiprocketHistoryTab';
