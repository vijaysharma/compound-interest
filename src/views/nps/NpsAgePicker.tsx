import React from 'react';
import ValuePicker from '../../components/ValuePicker';
import styles from '../NpsCalculator.module.scss';
interface NpsAgePickerProps {
  currentAge: number;
  setCurrentAge: (age: number) => void;
  retirementAge: number;
  setRetirementAge: (age: number) => void;
}
export function NpsAgePicker({
  currentAge,
  setCurrentAge,
  retirementAge,
  setRetirementAge,
}: NpsAgePickerProps) {
  return (
    <div className={styles.fieldGroup}>
      <ValuePicker
        variant="paired"
        sourceBadgeText="Current Age"
        targetBadgeText="Retire Age"
        sourceSlot={
          <select
            id="nps-current-age"
            value={currentAge}
            onChange={(e) => {
              const newAge = Number(e.target.value);
              setCurrentAge(newAge);
              if (retirementAge <= newAge) setRetirementAge(Math.min(75, newAge + 5));
            }}
            className={styles.numberInput}
            aria-label="Current Age"
          >
            {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
              <option key={age} value={age}>{age} Years</option>
            ))}
          </select>
        }
        targetSlot={
          <select
            id="nps-retirement-age"
            value={retirementAge}
            onChange={(e) => setRetirementAge(Number(e.target.value))}
            className={styles.numberInput}
            aria-label="Retirement Age"
          >
            {Array.from({ length: Math.max(1, 75 - currentAge) }, (_, i) => currentAge + 1 + i).map((age) => (
              <option key={age} value={age}>{age} Years</option>
            ))}
          </select>
        }
      />
      <p className={styles.annuitySplitNote}>
        Accumulation Period: <strong>{retirementAge - currentAge} Years</strong>
      </p>
    </div>
  );
}
