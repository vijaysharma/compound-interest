const ROITenureInput = ({ rt, setRt }) => {
  return (
    <div className="flex justify-between w-full mb-4">
      <label className="form-control w-40">
        <div className="label">
          <span className="label-text">ROI (%)</span>
        </div>
        <input
          type="text"
          placeholder="Type here"
          className="input input-bordered"
          value={rt.roi}
          onChange={(e) => setRt({ ...rt, roi: e.target.value })}
        />
      </label>
      <label className="form-control w-40">
        <div className="label">
          <span className="label-text">Tenure (Months)</span>
        </div>
        <input
          type="text"
          placeholder="Type here"
          className="input input-bordered"
          value={rt.tenure}
          onChange={(e) => setRt({ ...rt, tenure: e.target.value })}
        />
      </label>
    </div>
  );
};

export default ROITenureInput;
