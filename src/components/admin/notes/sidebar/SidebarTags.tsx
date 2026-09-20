'use client';
import React, { useState } from 'react';
import { FiTag, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styles from '../NotesSidebar.module.scss';
interface SidebarTagsProps {
  allTags: [string, number][];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}
export const SidebarTags: React.FC<SidebarTagsProps> = ({
  allTags,
  activeTag,
  onSelectTag,
}) => {
  const [tagsCollapsed, setTagsCollapsed] = useState(false);
  if (allTags.length === 0) return null;
  return (
    <div>
      <div className={styles.sectionHeader}>
        <button
          onClick={() => setTagsCollapsed(!tagsCollapsed)}
          className={styles.sectionToggle}
        >
          {tagsCollapsed ? (
            <FiChevronRight size={12} />
          ) : (
            <FiChevronDown size={12} />
          )}
          <span>Tags</span>
        </button>
        <span className={styles.tagCountBadge}>{allTags.length}</span>
      </div>
      {!tagsCollapsed && (
        <div className={`${styles.folderSection} ${styles.folderListContainer}`}>
          {allTags.map(([tag, count]) => {
            const isCurrent = activeTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onSelectTag(isCurrent ? null : tag)}
                className={`${styles.navItem} ${styles.tagNavItem} ${isCurrent ? styles.navItemActive : ''}`}
              >
                <span className={styles.navLeft}>
                  <FiTag size={14} className={styles.primaryIcon} />
                  <span>#{tag}</span>
                </span>
                <span className={styles.navCount}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
