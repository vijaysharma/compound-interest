import { sanctnum } from "../utilities/numSanitity";

const ROITenureInput = ({ rt, setRt }) => {
  return (
    <div className="flex justify-between w-full mb-4">
      <label className="form-control w-40">
        <div className="label">
          <span className="label-text">ROI (%)</span>
        </div>
        <input
          type="number"
          placeholder="Type here"
          className="input input-bordered input-primary"
          value={rt.roi}
          onChange={(e) => {
            const iv = e.target.value;
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
          type="number"
          placeholder="Type here"
          className="input input-bordered input-primary"
          value={rt.tenure}
          onChange={(e) => setRt({ ...rt, tenure: e.target.value })}
        />
      </label>
    </div>
  );
};

export default ROITenureInput;
