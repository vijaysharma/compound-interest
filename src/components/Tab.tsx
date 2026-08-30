import { TabType } from '../types/types';
const Tab = ({ name, child, selectedId, setSelectedId, isVisited = true }: TabType) => {
  return (
    <>
      <input
        type="radio"
        name={name}
        className={`tab calc-tab ${selectedId === child.props.id ? 'tab-active bg-primary text-primary-content [--tab-bg:var(--color-primary)] [--tab-border-color:var(--color-primary)]' : ''}`}
        aria-label={child.props['data-label']}
        checked={selectedId === child.props.id}
        onChange={() => {
          if (setSelectedId) {
            setSelectedId(child.props.id);
            window.localStorage.setItem('aid', child.props.id);
          }
        }}
      />
      <div role="tabpanel" className="tab-content py-2 w-full overflow-y-auto">
        {isVisited ? child : null}
      </div>
    </>
  );
};
export default Tab;
