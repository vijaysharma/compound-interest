import { useState } from 'react';
import Tab from './Tab';
import { TabsType } from '../types/types';
import styles from './Tabs.module.scss';
const Tabs = ({ name, children, activeId, setActiveId, className }: TabsType) => {
  const currentActiveId = activeId || '1';
  const [visitedIds, setVisitedIds] = useState<Set<string>>(() => new Set([currentActiveId]));
  const handleSelectTab = (id: string) => {
    setVisitedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    if (setActiveId) {
      setActiveId(id);
    }
  };
  return children instanceof Array ? (
    <div className={`${styles.tabsContainer} ${className || ''}`.trim()}>
      {children.map((child) => (
        <Tab
          key={child.props.id}
          name={name}
          child={child}
          selectedId={currentActiveId}
          setSelectedId={handleSelectTab}
          isVisited={visitedIds.has(child.props.id) || currentActiveId === child.props.id}
        />
      ))}
    </div>
  ) : (
    <div className={styles.contentWrapper}>{children}</div>
  );
};
export default Tabs;
