import { sanctnum } from "../utilities/numSanitity";

const ROITenureInput = ({ rt, setRt }) => {
  return (
    <div className="flex justify-between w-full mb-4">
      <label className="form-control w-28">
        <div className="label h-10">
          <span className="label-text text-nowrap">ROI (%)</span>
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
      <label className="form-control w-84">
        <div className="label h-10">
          <span className="label-text">Tenure </span>
        </div>

        <div className="join">
          <input
            type="number"
            placeholder="Type here"
            className="input input-bordered input-primary join-item w-28"
            value={rt.tenure}
            onChange={(e) => setRt({ ...rt, tenure: e.target.value })}
          />
          <input
            className="join-item input-bordered btn"
            type="radio"
            name="tenure"
            aria-label="M"
            value={"m"}
            checked={rt.tenureFormat === "m"}
            onChange={(e) => setRt({ ...rt, tenureFormat: e.target.value })}
          />
          <input
            className="join-item input-bordered btn"
            type="radio"
            name="tenure"
            aria-label="Y"
            value={"y"}
            checked={rt.tenureFormat === "y"}
            onChange={(e) => setRt({ ...rt, tenureFormat: e.target.value })}
          />
        </div>
      </label>

      {/* <label className="form-control w-32">
        <select
            className="select select-bordered select-primary select-xs w-full max-w-xs ml-4"
            value={rt.tenureFormat}
            onChange={(e) => setRt({ ...rt, tenureFormat: e.target.value })}
          >
            <option value={"m"}>Months</option>
            <option value={"y"}>Years</option>
          </select>

        <div className="label h-10">
          <span className="label-text"> </span>
        </div>
        <div className="join mx-auto">
          <input
            className="join-item btn"
            type="radio"
            name="tenure"
            aria-label="M"
            value={"m"}
          />
          <input
            className="join-item btn"
            type="radio"
            name="tenure"
            aria-label="Y"
            value={"y"}
          />
        </div>
      </label> */}
    </div>
  );
};

export default ROITenureInput;
