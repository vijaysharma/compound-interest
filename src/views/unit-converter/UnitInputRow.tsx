import React from 'react';
import styles from '../UnitConverter.module.scss';
interface UnitInputRowProps {
  label?: string;
  value: string;
  onChange?: (val: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  availableUnits: string[];
  readOnly?: boolean;
  isResult?: boolean;
  className?: string;
}
export const UnitInputRow: React.FC<UnitInputRowProps> = ({
  value,
  onChange,
  unit,
  onUnitChange,
  availableUnits,
  readOnly = false,
  isResult = false,
  className,
}) => (
  <div className={`${styles.rowJoin} ${className ?? ''}`}>
    <input
      type={readOnly ? 'text' : 'number'}
      className={`${styles.rowInput} ${isResult ? styles.resultInput : ''}`}
      maxLength={20}
      value={value}
      onChange={onChange ? (e) => onChange(e.target.value.slice(0, 20)) : undefined}
      placeholder={readOnly ? '0' : 'Enter value'}
      readOnly={readOnly}
    />
    <select
      className={styles.rowSelect}
      value={unit}
      onChange={(e) => onUnitChange(e.target.value)}
    >
      {availableUnits.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  </div>
);
