'use client';
import React from 'react';
import styles from './PairedPicker.module.scss';
export interface PairedPickerProps {
  title?: string;
  sourceBadgeText?: string;
  targetBadgeText?: string;
  sourceSlot?: React.ReactNode;
  targetSlot?: React.ReactNode;
  sourceValue?: string;
  targetValue?: string;
  onSourceChange?: (val: string) => void;
  onTargetChange?: (val: string) => void;
  sourceOptions?: Array<{ label: string; value: string }>;
  targetOptions?: Array<{ label: string; value: string }>;
  sourcePlaceholder?: string;
  targetPlaceholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  compact?: boolean;
  embedded?: boolean;
  layout?: 'auto' | 'mobile' | 'desktop';
  variant?: 'paired' | 'stacked-paired';
}
export const PairedPicker: React.FC<PairedPickerProps> = React.memo(
  ({
    variant = 'paired',
    title,
    sourceBadgeText = 'Source',
    targetBadgeText = 'Target',
    sourceSlot,
    targetSlot,
    sourceValue,
    targetValue,
    onSourceChange,
    onTargetChange,
    sourceOptions,
    targetOptions,
    sourcePlaceholder,
    targetPlaceholder,
    disabled = false,
    readOnly = false,
    className = '',
    compact = false,
    embedded = false,
    layout = 'auto',
  }) => {
    const layoutClass =
      layout === 'mobile' ? styles.layoutMobile : layout === 'desktop' ? styles.layoutDesktop : '';
    const compactClass = compact ? styles.compact : '';
    const embeddedClass = embedded ? styles.embedded : '';
    const rootContainerClass =
      `${styles.container} ${layoutClass} ${compactClass} ${embeddedClass} ${className}`.trim();
    return (
      <div className={rootContainerClass}>
        {title && <h5 className={styles.title}>{title}</h5>}
        <div
          className={`${styles.pairedStackedWrapper} ${
            variant === 'stacked-paired' ? styles.pairedStackedWrapperStack : ''
          }`.trim()}
        >
          {/* Source column */}
          <div className={styles.pairedStackedColumn}>
            <div className={styles.pairedStackedLabel}>{sourceBadgeText}</div>
            <div className={`${styles.pairedStackedSlot} ${styles.pairedStackedSlotLeft}`}>
              {sourceSlot ? (
                sourceSlot
              ) : sourceOptions && sourceOptions.length > 0 ? (
                <select
                  className={styles.pairedSelect}
                  value={sourceValue ?? ''}
                  onChange={(e) => onSourceChange?.(e.target.value)}
                  disabled={disabled}
                  aria-label={sourceBadgeText}
                >
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={styles.pairedInput}
                  value={sourceValue ?? ''}
                  placeholder={sourcePlaceholder || 'Select source'}
                  onChange={(e) => onSourceChange?.(e.target.value)}
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-label={sourceBadgeText}
                />
              )}
            </div>
          </div>
          {/* Target column */}
          <div className={styles.pairedStackedColumn}>
            <div className={`${styles.pairedStackedLabel} ${styles.pairedStackedLabelRight}`}>
              {targetBadgeText}
            </div>
            <div className={styles.pairedStackedSlot}>
              {targetSlot ? (
                targetSlot
              ) : targetOptions && targetOptions.length > 0 ? (
                <select
                  className={styles.pairedSelect}
                  value={targetValue ?? ''}
                  onChange={(e) => onTargetChange?.(e.target.value)}
                  disabled={disabled}
                  aria-label={targetBadgeText}
                >
                  {targetOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={styles.pairedInput}
                  value={targetValue ?? ''}
                  placeholder={targetPlaceholder || 'Select target'}
                  onChange={(e) => onTargetChange?.(e.target.value)}
                  disabled={disabled}
                  readOnly={readOnly}
                  aria-label={targetBadgeText}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
PairedPicker.displayName = 'PairedPicker';
export default PairedPicker;
