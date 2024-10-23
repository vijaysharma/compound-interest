import React, { useState } from "react";
import Tab from "./Tab";

const Tabs = ({ name, children, height, width }) => {
  const [selectedId, setSelectedId] = useState(1);

  return children instanceof Array ? (
    <div role="tablist" className="tabs tabs-lifted w-full">
      {children.map((child) => (
        <Tab
          key={child.props.id}
          name={name}
          child={child}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          height={height}
          width={width / children.length}
        />
      ))}
    </div>
  ) : (
    <div className="p-4 w-full overflow-y-auto" style={{ height }}>
      {children}
    </div>
  );
};

export default Tabs;
