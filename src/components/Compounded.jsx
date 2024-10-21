import React from "react";

const Compounded = ({ fr, setFr, className }) => {
  return (
    <div className={`form-control w-full text-center ${className}`}>
      <h5>Compounded</h5>
      <div className="join mx-auto">
        <button
          className={`join-item btn border-primary ${
            fr === 12 ? "btn-primary" : ""
          }`}
          onClick={() => setFr(12)}
        >
          Monthly
        </button>
        <button
          className={`join-item btn border-primary ${
            fr === 4 ? "btn-primary" : ""
          }`}
          onClick={() => setFr(4)}
        >
          Quarterly
        </button>
        <button
          className={`join-item btn border-primary ${
            fr === 1 ? "btn-primary" : ""
          }`}
          onClick={() => setFr(1)}
        >
          Yearly
        </button>
      </div>
    </div>
  );
};

export default Compounded;
