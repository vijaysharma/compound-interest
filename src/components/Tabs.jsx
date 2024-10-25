import React, { useState } from "react";
import Tab from "./Tab";

const Tabs = ({ name, children, activeId = 1, className }) => {
  const [selectedId, setSelectedId] = useState(activeId);
  return children instanceof Array ? (
    <div
      role="tablist"
      className={`tabs tabs-lifted w-full ${className || ""}`}
    >
      {children.map((child) => (
        <Tab
          key={child.props.id}
          name={name}
          child={child}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />
      ))}
    </div>
  ) : (
    <div className="p-4 w-full overflow-y-auto">{children}</div>
  );
};

export default Tabs;
