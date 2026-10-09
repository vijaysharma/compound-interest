'use client';
import React from 'react';
import { FiStar } from 'react-icons/fi';
import type { CourierCompany } from './types';
import styles from '../ShiprocketRates.module.scss';
export interface RatesTableProps {
  result: CourierCompany[];
}
export const RatesTable: React.FC<RatesTableProps> = React.memo(({ result }) => (
  <div className={styles.resultsSection}>
    <h3 className={styles.resultsTitle}>Available Couriers ({result.length})</h3>
    <div className={styles.tableContainer}>
      <table className={styles.ratesTable}>
        <thead>
          <tr>
            <th>Courier</th>
            <th>Est. Time</th>
            <th>Rate</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {result.map((c) => (
            <tr key={c.courier_company_id}>
              <td data-label="Courier" className={styles.courierName}>
                {c.courier_name}
              </td>
              <td data-label="Est. Time">{c.etd}</td>
              <td data-label="Rate" className={styles.rateVal}>
                ₹{c.rate}
              </td>
              <td data-label="Rating" className={styles.ratingVal}>
                {c.rating} <FiStar />
              </td>
            </tr>
          ))}
          {result.length === 0 && (
            <tr>
              <td colSpan={4} data-full className={styles.emptyState}>
                No couriers available for this route.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
));
RatesTable.displayName = 'RatesTable';
