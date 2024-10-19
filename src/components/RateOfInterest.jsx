import { useState } from "react";
import { sanctnum } from "../utilities/numSanitity";

const RateOfInterest = ({ rt, setRt }) => {
  const [expROI, setExpROI] = useState("+");
  const setROI = (n) => {
    let roi = parseFloat(rt.roi);
    if (expROI === "+") {
      roi += n;
    }
    if (expROI === "-") {
      roi -= n;
      if (roi <= 0) {
        setRt({ ...rt, roi: 0 });
        setExpROI("+");
        return;
      }
    }
    setRt({ ...rt, roi: Math.round((roi + Number.EPSILON) * 100) / 100 });
  };
  return (
    <div className="text-center mt-4">
      <h5>Rate of Interest (%)</h5>
      <div className="join focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(0.01)}
        >
          0.01
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(0.1)}
        >
          0.1
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(1)}
        >
          1
        </button>
        <input
          type="number"
          placeholder="Type here"
          min="0"
          className="join-item input input-bordered focus:outline-none text-center input-primary w-24"
          value={rt.roi.toString().replace(/^0+/, "") || 0}
          onChange={(e) => {
            const iv = Math.abs(e.target.value);
            if (sanctnum(iv) < 0) {
              setExpROI("+");
              return;
            }
            setRt({ ...rt, roi: iv });
          }}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="expROI"
          aria-label="+"
          value={"+"}
          checked={expROI === "+"}
          onChange={(e) => setExpROI(e.target.value)}
        />
        <input
          className="join-item input-bordered input-primary btn"
          type="radio"
          name="expROI"
          aria-label="-"
          value={"-"}
          disabled={rt.roi === 0}
          checked={expROI === "-"}
          onChange={(e) => setExpROI(e.target.value)}
        />
      </div>
    </div>
  );
};

export default RateOfInterest;
