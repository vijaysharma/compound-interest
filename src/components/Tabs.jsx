import React, { useState } from "react";
import Tab from "./Tab";

const Tabs = ({ name, children, height, width }) => {
  const [selectedId, setSelectedId] = useState(1);
  return (
    <div role="tablist" className="tabs tabs-lg tabs-bordered w-full">
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
  );
};

export default Tabs;
