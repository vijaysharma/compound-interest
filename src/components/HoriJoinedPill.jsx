import React from "react";

const HoriJoinedPill = ({
  data,
  selectedValue,
  updateSelectedValue,
  title,
  className,
}) => {
  return (
    <div className={`form-control w-full text-center ${className}`}>
      {title && <h5>{title}</h5>}

      <div className="join mx-auto">
        {data &&
          data.map((p) => (
            <button
              key={p.id}
              className={`join-item btn border-primary ${
                selectedValue === p.value ? "btn-primary" : ""
              }`}
              onClick={() => updateSelectedValue(p.value)}
            >
              {p.title}
            </button>
          ))}
      </div>
    </div>
  );
};

export default HoriJoinedPill;
