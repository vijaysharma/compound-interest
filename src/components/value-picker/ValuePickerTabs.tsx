import React from 'react';
import type { ValuePickerTab } from '../../data/valuePickerData';
import styles from '../ValuePicker.module.scss';
export interface ValuePickerTabsProps {
  tabs?: ValuePickerTab[];
  currentTab: string;
  componentId: string;
  disabled?: boolean;
  onTabClick: (tabId: string) => void;
}
export const ValuePickerTabs: React.FC<ValuePickerTabsProps> = React.memo(
  ({ tabs, currentTab, componentId, disabled, onTabClick }) => {
    if (!tabs || tabs.length === 0) return null;
    return (
      <div className={styles.tabsHeader} role="tablist" aria-label="Value type switcher">
        {tabs.map((tab) => {
          const tabIdentifier = tab.value !== undefined ? tab.value : tab.id;
          const isActive = currentTab === tabIdentifier || currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${componentId}-tab-${tab.id}`}
              aria-selected={isActive}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onTabClick(tabIdentifier)}
              disabled={disabled}
            >
              {tab.title}
            </button>
          );
        })}
      </div>
    );
  }
);
ValuePickerTabs.displayName = 'ValuePickerTabs';
