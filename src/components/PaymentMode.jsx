import React from "react";

const PaymentMode = ({ mode, setMode, className }) => {
  return (
    <div className={`form-control w-full text-center ${className}`}>
      <h5>Payout Mode</h5>
      <div className="join mx-auto">
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="payment-mode"
          aria-label="Monthly"
          value={1}
          checked={mode === 1}
          onChange={(e) => setMode(parseInt(e.target.value))}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="payment-mode"
          aria-label="Quarterly"
          value={3}
          checked={mode === 3}
          onChange={(e) => setMode(parseInt(e.target.value))}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="payment-mode"
          aria-label="Yearly"
          value={12}
          checked={mode === 12}
          onChange={(e) => setMode(parseInt(e.target.value))}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="payment-mode"
          aria-label="Cumulative"
          value={100}
          checked={mode === 100}
          onChange={(e) => setMode(parseInt(e.target.value))}
        />
      </div>
    </div>
  );
};

export default PaymentMode;
