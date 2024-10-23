const Tab = ({ name, child, selectedId, setSelectedId, height, width }) => {
  return (
    <>
      <input
        type="radio"
        name={name}
        role="tab"
        className={`tab ${
          selectedId === child.props.id
            ? "tab-active text-primary-content [--tab-bg:oklch(var(--p))] [--tab-border-color:oklch(var(--p))]"
            : ""
        }`}
        style={{ width, lineHeight: 1 }}
        aria-label={child.props.title}
        checked={selectedId === child.props.id}
        onChange={() => setSelectedId(child.props.id)}
      />
      <div
        role="tabpanel"
        className="tab-content p-4 w-full overflow-y-auto"
        style={{ height }}
      >
        {child}
      </div>
    </>
  );
};

export default Tab;
