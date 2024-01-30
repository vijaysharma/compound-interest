import { useState } from "react";
import { sanctnum } from "../utilities/numSanitity";
import Toast from "./Toast";

const ROITenureInput = ({ rt, setRt }) => {
  const [showToast, setShowToast] = useState(false);
  return (
    <div className="flex justify-between w-full mb-4">
      <label className="form-control w-40">
        <div className="label">
          <span className="label-text">ROI (%)</span>
        </div>
        <input
          type="text"
          placeholder="Type here"
          className="input input-bordered input-primary"
          value={rt.roi}
          onChange={(e) => {
            const iv = e.target.value;
            if (!sanctnum(iv) || sanctnum(iv) < 0) setShowToast(true);
            if (sanctnum(iv) < 0) return;
            setRt({ ...rt, roi: iv });
          }}
        />
      </label>
      <label className="form-control w-40">
        <div className="label">
          <span className="label-text">Tenure (Months)</span>
        </div>
        <input
          type="text"
          placeholder="Type here"
          className="input input-bordered input-primary"
          value={rt.tenure}
          onChange={(e) => setRt({ ...rt, tenure: e.target.value })}
        />
      </label>
      {/* {showToast && (
        <Toast message="Cannot compute. Please provide a valid data." />
      )} */}
    </div>
  );
};

export default ROITenureInput;
