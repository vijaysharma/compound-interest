import React from 'react';
import { UnitCategory } from './unitData';
import styles from '../UnitConverter.module.scss';
interface UnitEquivalentsCardProps {
  category: UnitCategory;
  equivalents: { unit: string; display: string }[];
  toUnit: string;
  setToUnit: (unit: string) => void;
}
export const UnitEquivalentsCard: React.FC<UnitEquivalentsCardProps> = ({
  category,
  equivalents,
  toUnit,
  setToUnit,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>All {category} Equivalents</span>
      </div>
      <div className={styles.equivalentsGrid}>
        {equivalents.map(({ unit, display }) => (
          <button
            key={unit}
            type="button"
            onClick={() => setToUnit(unit)}
            className={`${styles.equivalentItem}${unit === toUnit ? ` ${styles.equivalentItemActive}` : ''}`}
            title={`Set ${unit} as target`}
          >
            <span className={styles.equivalentUnit}>{unit}</span>
            <span className={styles.equivalentVal}>{display}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
