import React from 'react';
import { FiCheck } from 'react-icons/fi';
import styles from '../CountrySelect.module.scss';
interface CountryOptionItemProps {
  country: string;
  isSelected: boolean;
  onSelect: (country: string) => void;
  secondaryText?: string;
  itemKey: string;
}
export function CountryOptionItem({
  country,
  isSelected,
  onSelect,
  secondaryText,
  itemKey,
}: CountryOptionItemProps) {
  return (
    <div
      key={itemKey}
      role="option"
      aria-selected={isSelected}
      className={styles.optionItem}
    >
      <button
        type="button"
        className={`${styles.optionButton} ${isSelected ? styles.optionSelected : ''}`}
        onClick={() => onSelect(country)}
      >
        <span className={styles.optionLabel}>
          <span className={styles.countryName}>{country}</span>
          {secondaryText && (
            <span className={styles.secondaryBadge}>{secondaryText}</span>
          )}
        </span>
        {isSelected && <FiCheck className={styles.checkIcon} />}
      </button>
    </div>
  );
}
