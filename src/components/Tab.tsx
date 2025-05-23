import { TabType } from "../types/types";

const Tab = ({ name, child, selectedId, setSelectedId }: TabType) => {
  return (
    <>
      <input
        type="radio"
        name={name}
        role="tab"
        className={`tab calc-tab ${
          selectedId === child.props.id
            ? "tab-active bg-primary text-primary-content [--tab-bg:oklch(var(--p))] [--tab-border-color:oklch(var(--p))]"
            : ""
        }`}
        aria-label={child.props["data-label"]}
        checked={selectedId === child.props.id}
        onChange={() => {
          if (setSelectedId) {
            setSelectedId(child.props.id);
            window.localStorage.setItem("aid", child.props.id);
          }
        }}
      />
      <div
        role="tabpanel"
        className="tab-content px-4 py-2 w-full overflow-y-auto"
      >
        {child}
      </div>
    </>
  );
};

export default Tab;
