import Tab from "./Tab";
import { TabsType } from "../types/types";

const Tabs = ({
  name,
  children,
  activeId,
  setActiveId,
  className,
  type,
}: TabsType) => {
  return children instanceof Array ? (
    <div
      role="tablist"
      className={`tabs w-full ${className || ""} ${type || "tabs-lifted"}`}
    >
      {children.map((child) => (
        <Tab
          key={child.props.id}
          name={name}
          child={child}
          selectedId={activeId || "1"}
          setSelectedId={setActiveId}
        />
      ))}
    </div>
  ) : (
    <div className="p-4 w-full overflow-y-auto">{children}</div>
  );
};

export default Tabs;
