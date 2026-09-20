import React from 'react';
import styles from '../UnitConverter.module.scss';
interface UnitConverterHeroCardProps {
  unitRatio: string | null;
  fromUnit: string;
  toUnit: string;
  outputValue: string;
  inputValue: string;
  hasValue: boolean;
}
export const UnitConverterHeroCard: React.FC<UnitConverterHeroCardProps> = ({
  unitRatio,
  fromUnit,
  toUnit,
  outputValue,
  inputValue,
  hasValue,
}) => {
  return (
    <div className={`${styles.card} ${styles.heroCard}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Result</span>
        {unitRatio && (
          <span className={styles.formulaBadge}>
            1 {fromUnit} = {unitRatio} {toUnit}
          </span>
        )}
      </div>
      <div className={styles.heroValueRow}>
        <span className={styles.heroValue}>{outputValue || '—'}</span>
        <span className={styles.heroUnit}>{toUnit}</span>
      </div>
      {hasValue && outputValue && (
        <div className={styles.heroEquation}>
          {inputValue} {fromUnit} = {outputValue} {toUnit}
        </div>
      )}
    </div>
  );
};
