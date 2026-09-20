'use client';
import React from 'react';
import { formatRupees } from './money';
import styles from './StrategyCalculator.module.scss';
/**
 * Engine-derived totals as a wrapping chip row. Used for a panel's footer,
 * where a stack of one-per-line rows would push the next column off screen.
 */
export const DerivedChips = ({
  items,
}: {
  items: { label: string; value: number | string }[];
}) => (
  <dl className={styles.chipRow}>
    {items.map((item) => (
      <div key={item.label} className={styles.chip}>
        <dt className={styles.chipLabel}>{item.label}</dt>
        <dd className={styles.chipValue}>
          {typeof item.value === 'number' ? formatRupees(item.value) : item.value}
        </dd>
      </div>
    ))}
  </dl>
);
/** A read-only figure the engine derived, shown next to the inputs that drive it. */
export const DerivedRow = ({
  label,
  value,
  isMoney = true,
}: {
  label: string;
  value: number | string;
  isMoney?: boolean;
}) => (
  <div className={styles.derivedRow}>
    <span>{label}</span>
    <span className={styles.derivedValue}>
      {typeof value === 'number' && isMoney ? formatRupees(value) : value}
    </span>
  </div>
);
