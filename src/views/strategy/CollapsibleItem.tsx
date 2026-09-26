'use client';
import React, { useId } from 'react';
import { FiChevronDown, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import styles from './StrategyCalculator.module.scss';
interface CollapsibleItemProps {
  title: React.ReactNode;
  /**
   * The item's key facts on one line, shown while collapsed. This is what keeps
   * a list of periods or funds readable without expanding each one.
   */
  meta: string;
  open: boolean;
  onToggle: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  children: React.ReactNode;
}
/**
 * A repeated configuration item that collapses to a summary row. Only the item
 * being edited is expanded, so a column stays short enough to keep its heading
 * and the rest of the list in view.
 */
const BaseCollapsibleItem = ({
  title,
  meta,
  open,
  onToggle,
  onRemove,
  removeLabel,
  children,
}: CollapsibleItemProps) => {
  const bodyId = useId();
  return (
    <div className={`${styles.subCard} ${open ? styles.subCardOpen : ''}`.trim()}>
      <div className={styles.itemHead}>
        <button
          type="button"
          className={styles.itemToggle}
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
        >
          {open ? <FiChevronDown aria-hidden="true" /> : <FiChevronRight aria-hidden="true" />}
          <span className={styles.itemTitle}>{title}</span>
        </button>
        {onRemove && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onRemove}
            aria-label={removeLabel}
          >
            <FiTrash2 aria-hidden="true" />
          </button>
        )}
      </div>
      {!open && <p className={styles.itemMeta}>{meta}</p>}
      <div id={bodyId} className={styles.itemBody} hidden={!open}>
        {open && children}
      </div>
    </div>
  );
};
export const CollapsibleItem = React.memo(BaseCollapsibleItem);
