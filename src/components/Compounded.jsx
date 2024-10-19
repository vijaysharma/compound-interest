import React from "react";

const Compounded = ({ fr, setFr }) => {
  return (
    <div className="form-control w-full text-center">
      <h5>Compounded</h5>
      <div className="join mx-auto">
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="frequency"
          aria-label="Monthly"
          value={12}
          checked={fr === 12}
          onChange={(e) => setFr(parseInt(e.target.value))}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="frequency"
          aria-label="Quarterly"
          value={4}
          checked={fr === 4}
          onChange={(e) => setFr(parseInt(e.target.value))}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="frequency"
          aria-label="Yearly"
          value={1}
          checked={fr === 1}
          onChange={(e) => setFr(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default Compounded;
