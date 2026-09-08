import { TabType } from '../types/types';
import styles from './Tab.module.scss';
const Tab = ({ name, child, selectedId, setSelectedId, isVisited = true }: TabType) => {
  const isSelected = selectedId === child.props.id;
  return (
    <>
      <input
        type="radio"
        name={name}
        className={`${styles.radioTab} ${isSelected ? styles.active : ''}`.trim()}
        aria-label={child.props['data-label']}
        checked={isSelected}
        onChange={() => {
          if (setSelectedId) {
            setSelectedId(child.props.id);
            window.localStorage.setItem('aid', child.props.id);
          }
        }}
      />
      <div role="tabpanel" className={styles.tabContent}>
        {isVisited ? child : null}
      </div>
    </>
  );
};
export default Tab;
