import { useState } from "react";
import { sanctnum } from "../utilities/numSanitity";

const RateOfInterest = ({ rt, setRt, title, className }) => {
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
    <div className={`text-center w-full ${className}`}>
      <h5>{title || "Rate of Interest (%)"}</h5>
      <div className="join w-full focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(0.01)}
        >
          0.01
        </button>
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(0.1)}
        >
          0.1
        </button>
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(1)}
        >
          1
        </button>
        <input
          type="number"
          placeholder="Type here"
          min="0"
          className="join-item input input-sm input-bordered focus:outline-none text-center input-primary w-24"
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
        <button
          className={`join-item btn btn-sm grow border-primary ${
            expROI === "+" ? "btn-primary" : ""
          }`}
          onClick={(e) => setExpROI("+")}
        >
          +
        </button>
        <button
          className={`join-item btn btn-sm grow border-primary ${
            expROI === "-" ? "btn-primary" : ""
          }`}
          onClick={(e) => setExpROI("-")}
          disabled={rt.roi === 0}
        >
          -
        </button>
      </div>
    </div>
  );
};

export default RateOfInterest;
