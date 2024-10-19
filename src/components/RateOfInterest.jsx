import { sanctnum } from "../utilities/numSanitity";

const RateOfInterest = ({ rt, setRt }) => {
  const setROI = (n) => {
    let roi = rt.roi;
    roi += parseFloat(n);
    if (roi <= 0) {
      setRt({ ...rt, roi: 0 });
      return;
    }
    setRt({ ...rt, roi: Math.round((roi + Number.EPSILON) * 100) / 100 });
  };
  return (
    <div className="text-center mt-4">
      <h5>Rate of Interest (%)</h5>
      <div className="join focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline">
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(-0.01)}
        >
          -0.01
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(-0.1)}
        >
          -0.1
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(-1)}
        >
          -1
        </button>
        <input
          type="number"
          placeholder="Type here"
          min="0"
          className="join-item input input-bordered focus:outline-none text-center input-primary w-28"
          value={rt.roi}
          onChange={(e) => {
            const iv = Math.abs(e.target.value);
            if (sanctnum(iv) < 0) return;
            setRt({ ...rt, roi: iv });
          }}
        />
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(1)}
        >
          +1
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(0.1)}
        >
          +0.1
        </button>
        <button
          className="join-item btn border-primary"
          onClick={() => setROI(0.01)}
        >
          +0.01
        </button>
      </div>
    </div>
  );
};

export default RateOfInterest;
