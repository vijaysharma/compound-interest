import React, { useState } from "react";
import Tab from "./Tab";

const Tabs = ({ name, children, height }) => {
  const [selectedId, setSelectedId] = useState(1);
  return (
    <div role="tablist" className="tabs tabs-lg tabs-bordered">
      {children.map((child) => (
        <Tab
          key={child.props.id}
          name={name}
          child={child}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          height={height}
        />
      ))}
    </div>
  );
};

export default Tabs;
