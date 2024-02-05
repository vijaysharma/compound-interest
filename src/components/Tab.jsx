const Tab = ({ name, child, selectedId, setSelectedId, height }) => {
  return (
    <>
      <input
        type="radio"
        name={name}
        role="tab"
        className={`tab whitespace-nowrap box-content ${
          selectedId === child.props.id
            ? "tab-active bg-primary text-primary-content"
            : ""
        }`}
        aria-label={child.props.title}
        checked={selectedId === child.props.id}
        onChange={() => setSelectedId(child.props.id)}
      />
      <div
        role="tabpanel"
        className="tab-content p-4 overflow-y-auto"
        style={{ height }}
      >
        {child}
      </div>
    </>
  );
};

export default Tab;
