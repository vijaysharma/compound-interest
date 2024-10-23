import React from "react";

const HoriJoinedPill = ({
  data,
  selectedValue,
  updateSelectedValue,
  title,
  size,
  className,
  styleClass,
}) => {
  return (
    <div className={`form-control w-full text-center ${className}`}>
      {title && <h5>{title}</h5>}

      <div className="join mx-auto w-full">
        {data &&
          data.map((p) => (
            <button
              key={p.id}
              className={`join-item btn border-primary grow ${
                selectedValue === p.value && "btn-primary"
              } ${size && `btn-${size}`} ${styleClass}`}
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
