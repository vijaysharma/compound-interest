import { sanctnum } from "../utilities/numSanitity";
import { ROIType } from "../types/types";

const ROI = ({ rt, setRt, title, className }: ROIType) => {
  const setROI = (n: number) => {
    let roi = parseFloat(rt);
    roi += n;
    if (roi <= 0) {
      setRt("0");
      return;
    }
    setRt(`${Math.round((roi + Number.EPSILON) * 100) / 100}`);
  };
  return (
    <div className={`text-center w-full ${className}`}>
      <h5>{title || "Rate of Interest (%)"}</h5>
      <div className="join focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline w-full">
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(-0.1)}
        >
          -0.1
        </button>
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(-1)}
        >
          -1
        </button>
        <input
          type="number"
          placeholder="Type here"
          min="0"
          className="join-item input input-sm grow input-bordered focus:outline-none text-center input-primary w-24"
          value={rt.toString().replace(/^0+/, "") || 0}
          onChange={(e) => {
            const iv = e.target.value;
            if (sanctnum(iv) < 0) return;
            setRt(iv);
          }}
        />
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(1)}
        >
          +1
        </button>
        <button
          className="join-item btn btn-sm grow border-primary"
          onClick={() => setROI(0.1)}
        >
          +0.1
        </button>
      </div>
    </div>
  );
};
export default ROI;
